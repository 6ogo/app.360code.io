export default class SwitchableStream {
    readable: ReadableStream;
    private controller: ReadableStreamDefaultController | null = null;
    private onClose: (() => void) | null = null;
    switches: number = 0;
    
    constructor() {
      this.readable = new ReadableStream({
        start: (controller) => {
          this.controller = controller;
        },
        cancel: () => {
          if (this.onClose) {
            this.onClose();
          }
        },
      });
    }
    
    // Switch to a different source stream
    switchSource(stream: ReadableStream): void {
      this.switches++;
      
      const reader = stream.getReader();
      
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              break;
            }
            
            if (this.controller) {
              this.controller.enqueue(value);
            }
          }
        } catch (error) {
          console.error('Error reading from stream:', error);
          this.close();
        }
      };
      
      // If there's an existing onClose callback, call it before setting a new one
      if (this.onClose) {
        this.onClose();
      }
      
      // Set a new onClose callback
      this.onClose = () => {
        reader.cancel();
      };
      
      // Start pumping data from the new source
      pump();
    }
    
    // Close the stream
    close(): void {
      if (this.controller) {
        this.controller.close();
        this.controller = null;
      }
      
      if (this.onClose) {
        this.onClose();
        this.onClose = null;
      }
    }
  }