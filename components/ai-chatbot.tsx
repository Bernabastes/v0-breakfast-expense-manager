'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { useLanguage } from '@/lib/i18n/language-context'

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { t, language } = useLanguage()

  const { messages, sendMessage, status, setMessages, error } = useChat({
    transport: new DefaultChatTransport({ 
      api: '/api/chat',
      prepareSendMessagesRequest: ({ id, messages }) => ({
        body: {
          messages,
          id,
          language,
        },
      }),
    }),
  })

  const isLoading = status === 'streaming' || status === 'submitted'

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage({ text: input })
    setInput('')
  }

  const suggestedQuestions = language === 'am' 
    ? [
        'ዝቅተኛ ቀሪ ሂሳብ ያለው ማን ነው?',
        'በዚህ ወር ምን ያህል ወጪ አደረግን?',
        'ከፍተኛ አስተዋጽዖ ያደረጉትን አሳየኝ',
        'ዛሬ ምን ያህል ወጪ አደረግን?',
      ]
    : [
        'Who has the lowest balance?',
        'How much did we spend this month?',
        'Show top contributors',
        'What did we spend today?',
      ]

  const getMessageText = (message: typeof messages[0]): string => {
    if (!message.parts || !Array.isArray(message.parts)) return ''
    return message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
  }

  return (
    <>
      {/* Chat toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-amber-600 hover:bg-amber-700 text-white",
          "transition-all duration-200",
          isOpen && "rotate-90"
        )}
        size="icon"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
      </Button>

      {/* Chat window */}
      {isOpen && (
        <div className={cn(
          "fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)]",
          "bg-card border rounded-xl shadow-2xl overflow-hidden",
          "flex flex-col",
          "animate-in slide-in-from-bottom-5 fade-in duration-200"
        )}>
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b bg-amber-50 dark:bg-amber-950/30">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-amber-600 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {language === 'am' ? 'AI ረዳት' : 'AI Assistant'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {language === 'am' ? 'ስለ ወጪዎች ይጠይቁኝ' : 'Ask me about expenses'}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px] min-h-[300px]">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 bg-muted rounded-lg rounded-tl-none p-3">
                    <p className="text-sm">
                      {language === 'am' 
                        ? 'ሰላም! ስለ ቁርስ ወጪዎች፣ ቀሪ ሂሳቦች እና ሌሎች መረጃዎች ልረዳዎ እችላለሁ። ምን ማወቅ ይፈልጋሉ?'
                        : 'Hello! I can help you with information about breakfast expenses, balances, and more. What would you like to know?'}
                    </p>
                  </div>
                </div>

                {/* Suggested questions */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground px-1">
                    {language === 'am' ? 'የሚጠቁ ጥያቄዎች:' : 'Try asking:'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          sendMessage({ text: question })
                        }}
                        className="text-xs bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-200 px-3 py-1.5 rounded-full transition-colors"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((message) => {
              const text = getMessageText(message)
              if (!text) return null
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                    message.role === 'user' 
                      ? "bg-primary text-primary-foreground"
                      : "bg-amber-100 dark:bg-amber-900/50"
                  )}>
                    {message.role === 'user' 
                      ? <User className="h-4 w-4" />
                      : <Bot className="h-4 w-4 text-amber-600" />
                    }
                  </div>
                  <div className={cn(
                    "flex-1 rounded-lg p-3 text-sm",
                    message.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-muted rounded-tl-none"
                  )}>
                    <p className="whitespace-pre-wrap">{text}</p>
                  </div>
                </div>
              )
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-amber-600" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-none p-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                </div>
                <div className="bg-red-50 dark:bg-red-950/30 rounded-lg rounded-tl-none p-3 text-sm text-red-800 dark:text-red-200">
                  <p className="font-medium">
                    {language === 'am' ? 'ስህተት ተከስቷል' : 'Error occurred'}
                  </p>
                  <p className="text-xs mt-1 opacity-80">
                    {error.message?.includes('credit card') 
                      ? (language === 'am' 
                          ? 'AI Gateway ለመጠቀም የክሬዲት ካርድ ማረጋገጫ ያስፈልጋል። እባክዎ የVercel መለያዎን ያዋቅሩ።'
                          : 'AI Gateway requires credit card verification. Please configure your Vercel account.')
                      : (language === 'am' 
                          ? 'መልስ ማግኘት አልተቻለም። እባክዎ እንደገና ይሞክሩ።'
                          : 'Could not get a response. Please try again.')
                    }
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={language === 'am' ? 'መልእክትዎን ይጻፉ...' : 'Type your message...'}
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon"
                disabled={!input.trim() || isLoading}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
