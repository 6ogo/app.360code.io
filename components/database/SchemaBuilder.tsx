// components/database/SchemaBuilder.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useToast } from '@/components/providers/ToastProvider';

interface SchemaBuilderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TableSchema {
  id: string;
  name: string;
  columns: ColumnSchema[];
  relationships: RelationshipSchema[];
  enableRLS: boolean;
}

interface ColumnSchema {
  id: string;
  name: string;
  type: string;
  nullable: boolean;
  isPrimary: boolean;
  isUnique: boolean;
  defaultValue: string;
}

interface RelationshipSchema {
  id: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-one';
}

const DATA_TYPES = [
  'text',
  'varchar',
  'bigint',
  'boolean',
  'date',
  'integer',
  'json',
  'jsonb',
  'numeric',
  'real',
  'serial',
  'timestamp',
  'timestamptz',
  'uuid'
];

export default function SchemaBuilder({ isOpen, onClose }: SchemaBuilderProps) {
  const [tables, setTables] = useState<TableSchema[]>([]);
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSQL, setGeneratedSQL] = useState<string>('');
  const [tab, setTab] = useState<'visual' | 'sql' | 'preview'>('visual');
  
  const { supabase, user } = useSupabase();
  const { showToast } = useToast();
  
  useEffect(() => {
    // Add initial table if none exists
    if (tables.length === 0) {
      addTable();
    }
  }, []);
  
  const addTable = () => {
    const newTable: TableSchema = {
      id: `table-${Date.now()}`,
      name: `table_${tables.length + 1}`,
      columns: [
        {
          id: `col-${Date.now()}`,
          name: 'id',
          type: 'serial',
          nullable: false,
          isPrimary: true,
          isUnique: true,
          defaultValue: ''
        }
      ],
      relationships: [],
      enableRLS: true
    };
    
    setTables([...tables, newTable]);
    setActiveTableId(newTable.id);
  };
  
  const updateTable = (id: string, updates: Partial<TableSchema>) => {
    setTables(tables.map(table => 
      table.id === id ? { ...table, ...updates } : table
    ));
  };
  
  const deleteTable = (id: string) => {
    setTables(tables.filter(table => table.id !== id));
    if (activeTableId === id) {
      setActiveTableId(tables.length > 1 ? tables[0].id : null);
    }
  };
  
  const addColumn = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const newColumn: ColumnSchema = {
      id: `col-${Date.now()}`,
      name: `column_${table.columns.length + 1}`,
      type: 'text',
      nullable: true,
      isPrimary: false,
      isUnique: false,
      defaultValue: ''
    };
    
    const updatedColumns = [...table.columns, newColumn];
    updateTable(tableId, { columns: updatedColumns });
  };
  
  const updateColumn = (tableId: string, columnId: string, updates: Partial<ColumnSchema>) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const updatedColumns = table.columns.map(column => 
      column.id === columnId ? { ...column, ...updates } : column
    );
    
    updateTable(tableId, { columns: updatedColumns });
  };
  
  const deleteColumn = (tableId: string, columnId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const updatedColumns = table.columns.filter(column => column.id !== columnId);
    updateTable(tableId, { columns: updatedColumns });
  };
  
  const addRelationship = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    // Default to first column and first other table
    const fromColumn = table.columns[0]?.name || '';
    const otherTable = tables.find(t => t.id !== tableId);
    const toTable = otherTable?.name || '';
    const toColumn = otherTable?.columns[0]?.name || '';
    
    const newRelationship: RelationshipSchema = {
      id: `rel-${Date.now()}`,
      fromColumn,
      toTable,
      toColumn,
      type: 'one-to-many'
    };
    
    const updatedRelationships = [...table.relationships, newRelationship];
    updateTable(tableId, { relationships: updatedRelationships });
  };
  
  const updateRelationship = (
    tableId: string, 
    relationshipId: string, 
    updates: Partial<RelationshipSchema>
  ) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const updatedRelationships = table.relationships.map(relationship => 
      relationship.id === relationshipId ? { ...relationship, ...updates } : relationship
    );
    
    updateTable(tableId, { relationships: updatedRelationships });
  };
  
  const deleteRelationship = (tableId: string, relationshipId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const updatedRelationships = table.relationships.filter(
      relationship => relationship.id !== relationshipId
    );
    
    updateTable(tableId, { relationships: updatedRelationships });
  };
  
  const generateSQL = () => {
    let sql = '-- Generated by 360code.io Schema Builder\n\n';
    
    // Add extension for UUID if needed
    if (tables.some(table => 
      table.columns.some(col => col.type === 'uuid')
    )) {
      sql += 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";\n\n';
    }
    
    // Create tables
    for (const table of tables) {
      sql += `-- Table: ${table.name}\n`;
      sql += `CREATE TABLE ${table.name} (\n`;
      
      // Columns
      const columnDefs = table.columns.map(column => {
        let def = `  ${column.name} ${column.type.toUpperCase()}`;
        
        if (column.isPrimary) {
          def += ' PRIMARY KEY';
        }
        
        if (column.isUnique && !column.isPrimary) {
          def += ' UNIQUE';
        }
        
        if (!column.nullable) {
          def += ' NOT NULL';
        }
        
        if (column.defaultValue) {
          def += ` DEFAULT ${column.defaultValue}`;
        }
        
        return def;
      });
      
      sql += columnDefs.join(',\n');
      sql += '\n);\n\n';
      
      // Row Level Security
      if (table.enableRLS) {
        sql += `-- Enable RLS for ${table.name}\n`;
        sql += `ALTER TABLE ${table.name} ENABLE ROW LEVEL SECURITY;\n\n`;
        
        // Add default policies
        sql += `-- Create policies for ${table.name}\n`;
        sql += `CREATE POLICY "Allow select for authenticated users" ON ${table.name} FOR SELECT USING (auth.uid() IS NOT NULL);\n`;
        sql += `CREATE POLICY "Allow insert for authenticated users" ON ${table.name} FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);\n`;
        sql += `CREATE POLICY "Allow update for authenticated users" ON ${table.name} FOR UPDATE USING (auth.uid() IS NOT NULL);\n`;
        sql += `CREATE POLICY "Allow delete for authenticated users" ON ${table.name} FOR DELETE USING (auth.uid() IS NOT NULL);\n\n`;
      }
    }
    
    // Add relationships (foreign keys)
    for (const table of tables) {
      for (const rel of table.relationships) {
        sql += `-- Add foreign key constraint for ${table.name}.${rel.fromColumn} -> ${rel.toTable}.${rel.toColumn}\n`;
        sql += `ALTER TABLE ${table.name} ADD CONSTRAINT fk_${table.name}_${rel.toTable} FOREIGN KEY (${rel.fromColumn}) REFERENCES ${rel.toTable}(${rel.toColumn});\n\n`;
      }
    }
    
    setGeneratedSQL(sql);
  };
  
  const deploySchema = async () => {
    if (!user) {
      showToast('You must be logged in to deploy schemas', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate SQL if not already generated
      if (!generatedSQL) {
        generateSQL();
      }
      
      // Using Supabase SQL API to execute the schema changes
      const { error } = await supabase.rpc('exec_sql', {
        query: generatedSQL
      });
      
      if (error) {
        console.error('Error deploying schema:', error);
        showToast(`Error deploying schema: ${error.message}`, 'error');
        return;
      }
      
      showToast('Schema deployed successfully', 'success');
    } catch (err) {
      console.error('Error during deployment:', err);
      showToast('Failed to deploy schema', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const exportSchema = () => {
    try {
      // Generate SQL if not already done
      if (!generatedSQL) {
        generateSQL();
      }
      
      // Create and download file
      const blob = new Blob([generatedSQL], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'schema.sql';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting schema:', err);
      showToast('Failed to export schema', 'error');
    }
  };
  
  if (!isOpen) return null;
  
  const activeTable = tables.find(table => table.id === activeTableId);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-[95vw] max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-xl font-semibold">Database Schema Builder</h2>
          <button 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition"
          >
            <i className="fa-solid fa-times"></i>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-border">
          <button
            className={`px-4 py-2 font-medium ${tab === 'visual' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('visual')}
          >
            Visual Schema
          </button>
          <button
            className={`px-4 py-2 font-medium ${tab === 'sql' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => {
              generateSQL();
              setTab('sql');
            }}
          >
            SQL Preview
          </button>
          <button
            className={`px-4 py-2 font-medium ${tab === 'preview' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
            onClick={() => setTab('preview')}
          >
            Schema Preview
          </button>
        </div>
        
        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {tab === 'visual' && (
            <>
              {/* Table list */}
              <div className="w-56 border-r border-border overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium">Tables</h3>
                  <button
                    onClick={addTable}
                    className="text-primary hover:text-primary-hover"
                    title="Add Table"
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                <div className="space-y-2">
                  {tables.map(table => (
                    <div
                      key={table.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer ${
                        activeTableId === table.id 
                          ? 'bg-primary text-white' 
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => setActiveTableId(table.id)}
                    >
                      <span className="truncate">{table.name}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable(table.id);
                        }}
                        className={`${
                          activeTableId === table.id 
                            ? 'text-white/70 hover:text-white' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        title="Delete Table"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Table details */}
              <div className="flex-1 overflow-y-auto p-4">
                {activeTable ? (
                  <div>
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-1">
                        Table Name
                      </label>
                      <input
                        type="text"
                        value={activeTable.name}
                        onChange={(e) => updateTable(activeTable.id, { name: e.target.value })}
                        className="w-full p-2 bg-card border border-border rounded"
                      />
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Columns</h3>
                        <button
                          onClick={() => addColumn(activeTable.id)}
                          className="text-primary hover:text-primary-hover"
                          title="Add Column"
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      
                      <div className="border border-border rounded overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-muted/30">
                            <tr>
                              <th className="px-4 py-2 text-left">Name</th>
                              <th className="px-4 py-2 text-left">Type</th>
                              <th className="px-4 py-2 text-center">Primary</th>
                              <th className="px-4 py-2 text-center">Unique</th>
                              <th className="px-4 py-2 text-center">Nullable</th>
                              <th className="px-4 py-2 text-left">Default</th>
                              <th className="px-4 py-2 text-center">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {activeTable.columns.map(column => (
                              <tr key={column.id} className="border-t border-border">
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={column.name}
                                    onChange={(e) => updateColumn(
                                      activeTable.id, 
                                      column.id, 
                                      { name: e.target.value }
                                    )}
                                    className="w-full p-1 bg-card border border-border rounded"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <select
                                    value={column.type}
                                    onChange={(e) => updateColumn(
                                      activeTable.id, 
                                      column.id, 
                                      { type: e.target.value }
                                    )}
                                    className="w-full p-1 bg-card border border-border rounded"
                                  >
                                    {DATA_TYPES.map(type => (
                                      <option key={type} value={type}>
                                        {type}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={column.isPrimary}
                                    onChange={(e) => updateColumn(
                                      activeTable.id, 
                                      column.id, 
                                      { isPrimary: e.target.checked }
                                    )}
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={column.isUnique}
                                    onChange={(e) => updateColumn(
                                      activeTable.id, 
                                      column.id, 
                                      { isUnique: e.target.checked }
                                    )}
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={column.nullable}
                                    onChange={(e) => updateColumn(
                                      activeTable.id, 
                                      column.id, 
                                      { nullable: e.target.checked }
                                    )}
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={column.defaultValue}
                                    onChange={(e) => updateColumn(
                                      activeTable.id, 
                                      column.id, 
                                      { defaultValue: e.target.value }
                                    )}
                                    className="w-full p-1 bg-card border border-border rounded"
                                    placeholder="Default value"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => deleteColumn(activeTable.id, column.id)}
                                    className="text-red-500 hover:text-red-700"
                                    disabled={column.isPrimary}
                                    title={column.isPrimary ? "Cannot delete primary key" : "Delete column"}
                                  >
                                    <i className="fas fa-trash-alt"></i>
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">Relationships</h3>
                        <button
                          onClick={() => addRelationship(activeTable.id)}
                          className="text-primary hover:text-primary-hover"
                          title="Add Relationship"
                          disabled={tables.length < 2}
                        >
                          <i className="fas fa-plus"></i>
                        </button>
                      </div>
                      
                      {tables.length < 2 ? (
                        <div className="text-sm text-muted-foreground p-4 border border-border rounded bg-muted/10">
                          You need at least two tables to create relationships.
                        </div>
                      ) : activeTable.relationships.length === 0 ? (
                        <div className="text-sm text-muted-foreground p-4 border border-border rounded bg-muted/10">
                          No relationships defined. Click + to add one.
                        </div>
                      ) : (
                        <div className="border border-border rounded overflow-hidden">
                          <table className="w-full">
                            <thead className="bg-muted/30">
                              <tr>
                                <th className="px-4 py-2 text-left">From Column</th>
                                <th className="px-4 py-2 text-left">To Table</th>
                                <th className="px-4 py-2 text-left">To Column</th>
                                <th className="px-4 py-2 text-left">Type</th>
                                <th className="px-4 py-2 text-center">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {activeTable.relationships.map(rel => (
                                <tr key={rel.id} className="border-t border-border">
                                  <td className="px-4 py-2">
                                    <select
                                      value={rel.fromColumn}
                                      onChange={(e) => updateRelationship(
                                        activeTable.id, 
                                        rel.id, 
                                        { fromColumn: e.target.value }
                                      )}
                                      className="w-full p-1 bg-card border border-border rounded"
                                    >
                                      {activeTable.columns.map(col => (
                                        <option key={col.id} value={col.name}>
                                          {col.name}
                                        </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={rel.toTable}
                                      onChange={(e) => updateRelationship(
                                        activeTable.id, 
                                        rel.id, 
                                        { toTable: e.target.value }
                                      )}
                                      className="w-full p-1 bg-card border border-border rounded"
                                    >
                                      {tables
                                        .filter(t => t.id !== activeTable.id)
                                        .map(table => (
                                          <option key={table.id} value={table.name}>
                                            {table.name}
                                          </option>
                                      ))}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={rel.toColumn}
                                      onChange={(e) => updateRelationship(
                                        activeTable.id, 
                                        rel.id, 
                                        { toColumn: e.target.value }
                                      )}
                                      className="w-full p-1 bg-card border border-border rounded"
                                    >
                                      {tables
                                        .find(t => t.name === rel.toTable)
                                        ?.columns.map(col => (
                                          <option key={col.id} value={col.name}>
                                            {col.name}
                                          </option>
                                        )) || <option value="">Select column</option>}
                                    </select>
                                  </td>
                                  <td className="px-4 py-2">
                                    <select
                                      value={rel.type}
                                      onChange={(e) => updateRelationship(
                                        activeTable.id, 
                                        rel.id, 
                                        { type: e.target.value as 'one-to-one' | 'one-to-many' | 'many-to-one' }
                                      )}
                                      className="w-full p-1 bg-card border border-border rounded"
                                    >
                                      <option value="one-to-one">One-to-One</option>
                                      <option value="one-to-many">One-to-Many</option>
                                      <option value="many-to-one">Many-to-One</option>
                                    </select>
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <button
                                      onClick={() => deleteRelationship(activeTable.id, rel.id)}
                                      className="text-red-500 hover:text-red-700"
                                      title="Delete relationship"
                                    >
                                      <i className="fas fa-trash-alt"></i>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enable-rls"
                          checked={activeTable.enableRLS}
                          onChange={(e) => updateTable(
                            activeTable.id, 
                            { enableRLS: e.target.checked }
                          )}
                          className="mr-2"
                        />
                        <label htmlFor="enable-rls" className="text-sm font-medium">
                          Enable Row Level Security (RLS)
                        </label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        When enabled, only authenticated users can access, insert, update, or delete rows.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-4xl text-muted-foreground mb-4">
                        <i className="fas fa-table"></i>
                      </div>
                      <h3 className="text-lg font-medium mb-2">No table selected</h3>
                      <p className="text-muted-foreground">
                        Select a table from the sidebar or create a new one
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {tab === 'sql' && (
            <div className="flex-1 p-4">
              <div className="mb-4 flex justify-between items-center">
                <h3 className="font-medium">Generated SQL</h3>
                <button
                  onClick={exportSchema}
                  className="px-3 py-1 bg-primary text-white rounded text-sm flex items-center"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download SQL
                </button>
              </div>
              <div className="border border-border rounded bg-card p-4 h-full overflow-auto">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {generatedSQL || 'Click "Generate SQL" to see the SQL for your schema.'}
                </pre>
              </div>
            </div>
          )}
          
          {tab === 'preview' && (
            <div className="flex-1 p-4">
              <div className="mb-4">
                <h3 className="font-medium">Schema Preview</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize your database schema with tables and relationships.
                </p>
              </div>
              <div className="border border-border rounded bg-card p-6 h-full overflow-auto">
                {tables.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tables.map(table => (
                      <div 
                        key={table.id} 
                        className="border border-border rounded-lg overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="bg-muted/30 px-4 py-2 border-b border-border">
                          <h4 className="font-medium">{table.name}</h4>
                        </div>
                        <div className="p-0">
                          <table className="w-full text-sm">
                            <tbody>
                              {table.columns.map(column => (
                                <tr key={column.id} className="border-b border-border last:border-b-0">
                                  <td className="px-4 py-2 flex items-center">
                                    {column.isPrimary && (
                                      <span className="text-yellow-500 mr-2" title="Primary Key">
                                        <i className="fas fa-key text-xs"></i>
                                      </span>
                                    )}
                                    {column.name}
                                  </td>
                                  <td className="px-4 py-2 text-right text-muted-foreground">
                                    {column.type}
                                    {column.nullable ? '' : ' NOT NULL'}
                                    {column.isUnique && !column.isPrimary ? ' UNIQUE' : ''}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {table.relationships.length > 0 && (
                          <div className="bg-muted/10 px-4 py-2 border-t border-border">
                            <p className="text-xs font-medium mb-1">Relationships:</p>
                            <ul className="text-xs space-y-1 text-muted-foreground">
                              {table.relationships.map(rel => (
                                <li key={rel.id} className="flex items-center">
                                  <span className="text-primary mr-1">
                                    <i className="fas fa-link text-xs"></i>
                                  </span>
                                  {rel.fromColumn} → {rel.toTable}.{rel.toColumn}
                                  <span className="ml-1 text-xs opacity-70">({rel.type})</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <div className="text-4xl text-muted-foreground mb-4">
                      <i className="fas fa-database"></i>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tables defined</h3>
                    <p className="text-muted-foreground">
                      Create tables in the Visual Schema tab to see a preview
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="border-t border-border p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-muted"
          >
            Cancel
          </button>
          {tab === 'visual' && (
            <button
              onClick={generateSQL}
              className="px-4 py-2 bg-muted text-foreground border border-border rounded-md hover:bg-muted/80"
            >
              Generate SQL
            </button>
          )}
          {user && (
            <button
              onClick={deploySchema}
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:opacity-50"
            >
              {isLoading ? 'Deploying...' : 'Deploy to Supabase'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}