"use client"

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ResizableLayout } from '@/components/ResizableLayout'
import { SidebarSources } from '@/components/SidebarSources'
import { AdobePdfViewer } from '@/components/AdobePdfViewer'
import { ChatPanel } from '@/components/ChatPanel'
import { StudioPanel } from '@/components/StudioPanel'
import { Loader2, Edit2, Check, X as CloseIcon, ShieldAlert } from 'lucide-react'
import { ScanningLoader } from '@/components/ScanningLoader'
import { auth } from '@/lib/firebase'
import { useAuthStore } from '@/lib/authStore'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { getNotebookAction, updateNotebookTitleAction } from '@/lib/actions'

import { ThemeToggle } from '@/components/ThemeToggle';

export default function DocumentPage() {
  const params = useParams()
  const router = useRouter()
  const notebookId = params.id as string
  const { role, init } = useAuthStore()
  
  const [notebook, setNotebook] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [activeSource, setActiveSource] = useState<{name: string, url: string, page?: number} | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [sources, setSources] = useState<any[]>([])

  useEffect(() => {
    init()
  }, [])

  useEffect(() => {
    async function loadNotebook() {
      if (!role) return
      setLoading(true)
      try {
        const data = await getNotebookAction(notebookId, role)

        if (data) {
          setNotebook(data)
          setTempTitle(data.title)
        } else {
          setAccessDenied(true)
        }
      } catch (error) {
        console.error("Error loading notebook:", error)
      } finally {
        setLoading(false)
      }
    }
    loadNotebook()
  }, [notebookId, role, router])

  useEffect(() => {
    async function loadMessages() {
      if (activeSessionId) {
        const { getChatMessagesAction } = await import('@/lib/actions')
        const msgs = await getChatMessagesAction(activeSessionId)
        setMessages(msgs.map(m => ({ role: m.role, content: m.content })))
      } else {
        setMessages([])
      }
    }
    loadMessages()
  }, [activeSessionId])

  const handleRename = async (newTitle: string) => {
    if (!newTitle.trim() || role !== 'ADMIN') return
    try {
      const result = await updateNotebookTitleAction(notebookId, newTitle, role)
      if (result.success) {
        setNotebook({ ...notebook, title: newTitle })
      }
    } catch (error) {
      console.error("Rename error:", error)
    }
  }

  const handleSaveMessage = async (role: string, content: string) => {
    let sessionId = activeSessionId;
    const { createChatSessionAction, saveChatMessageAction } = await import('@/lib/actions')
    
    if (!sessionId && auth.currentUser) {
      const res = await createChatSessionAction(notebookId, auth.currentUser.uid, "Chat " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      if (res.success && res.session) {
        sessionId = res.session.id;
        setActiveSessionId(sessionId);
        setSessions(prev => [res.session, ...prev]);
      }
    }
    
    if (sessionId) {
      await saveChatMessageAction(sessionId, role, content);
    }
  }

  const handleCitationClick = (citationId: string) => {
    // Parse page from citationId (e.g. p25:b3c5367c -> 25)
    const pageMatch = citationId.match(/^p(\d+):/);
    const page = pageMatch ? parseInt(pageMatch[1], 10) : undefined;
    
    // Open the PDF to the relevant page
    if (notebook?.fileUrls?.[0]) {
      setActiveSource({
        name: notebook.fileUrls[0].split('/').pop()?.split('?')[0]?.replace(/%20/g, ' ') || 'Source',
        url: notebook.fileUrls[0],
        page: page
      })
      setIsLeftCollapsed(false)
      setIsRightCollapsed(true)
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <ScanningLoader />
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background space-y-6">
        <div className="p-4 rounded-full bg-red-500/10">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to view this document.</p>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-xl font-bold"
        >
          Go back to Dashboard
        </button>
      </div>
    )
  }

  const title = notebook?.title || "Untitled document"

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-screen bg-background">
        {/* Navbar */}
        <nav className="flex items-center justify-between px-6 py-3 border-b border-border/30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 shadow-sm">
                <img 
                  src="https://res.cloudinary.com/dktgnnqia/image/upload/v1777817754/Adani_2012_logo-removebg-preview_n7pgul.png" 
                  alt="Adani Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
            </button>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 group">
                  <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">Adani QueryAI</h1>
                </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </nav>

        {/* Main Resizable Content */}
        <ResizableLayout 
          hasSources={notebook?.fileUrls && notebook.fileUrls.length > 0}
          isLeftCollapsed={isLeftCollapsed}
          setIsLeftCollapsed={setIsLeftCollapsed}
          isRightCollapsed={isRightCollapsed}
          setIsRightCollapsed={setIsRightCollapsed}
          defaultLeftSize={activeSource ? 45 : 20}
          leftPanel={
            activeSource ? (
              <AdobePdfViewer 
                url={activeSource.url} 
                fileName={activeSource.name}
                initialPage={activeSource.page}
                onClose={() => {
                  setActiveSource(null)
                  setIsRightCollapsed(false)
                }}
              />
            ) : (
              <SidebarSources 
                files={notebook?.fileUrls ? notebook.fileUrls.map((url: string, i: number) => ({ 
                  name: url.split('/').pop()?.split('?')[0]?.replace(/%20/g, ' ') || `Source ${i+1}`, 
                  url 
                })) : []} 
                onSelectSource={(file) => {
                  setActiveSource(file)
                  setIsLeftCollapsed(false)
                  setIsRightCollapsed(true)
                }}
              />
            )
          }
          centerPanel={
            <ChatPanel 
              documentTitle={title} 
              sourceCount={notebook?.fileUrls?.length || 0}
              messages={messages}
              setMessages={setMessages}
              setSources={setSources}
              onRename={handleRename}
              isOwner={role === 'ADMIN'}
              onCitationClick={handleCitationClick}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelectSession={setActiveSessionId}
              onNewSession={() => setActiveSessionId(null)}
              onSaveMessage={handleSaveMessage}
            />
          }
          rightPanel={<StudioPanel sources={sources} onSourceClick={handleCitationClick} />}
        />
      </div>
    </ProtectedRoute>
  )
}
