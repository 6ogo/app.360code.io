import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = 'qwen-2.5-coder-32b', temperature = 0.7 } = await request.json()

    // Validate required parameters
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Validate API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      console.error('GROQ_API_KEY is not configured')
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured. Please check your environment variables.' },
        { status: 500 }
      )
    }

    // Initialize Groq client
    const groq = new Groq({ apiKey })

    console.log(`Generating code with model: ${model}, temperature: ${temperature}`)

    // Create completion
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert developer. Generate clean, well-commented code based on the request. Include Supabase integration when appropriate. Wrap code blocks in triple backticks with the language name to help the client parse them correctly.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: parseFloat(temperature.toString()),
      max_tokens: 4000,
    })

    const generatedCode = completion.choices[0].message.content
    console.log('Code generated successfully')

    return NextResponse.json({ code: generatedCode })
  } catch (error) {
    console.error('Error generating code:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate code' },
      { status: 500 }
    )
  }
}