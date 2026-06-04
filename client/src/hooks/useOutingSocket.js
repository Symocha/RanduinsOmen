import { useEffect, useRef } from 'react'
import { io } from 'socket.io-client'

export function useOutingSocket(outingId, handlers) {
  const handlersRef = useRef(handlers)
  useEffect(() => { handlersRef.current = handlers })

  useEffect(() => {
    if (!outingId) return
    const token = localStorage.getItem('token')
    const socket = io({ auth: { token } })

    socket.emit('join-outing', outingId)

    socket.on('vote:toggle', (data) => handlersRef.current.onVoteToggle?.(data))
    socket.on('rsvp:update', (data) => handlersRef.current.onRsvpUpdate?.(data))
    socket.on('member:added', (data) => handlersRef.current.onMemberAdded?.(data))
    socket.on('outing:updated', (data) => handlersRef.current.onOutingUpdated?.(data))

    return () => {
      socket.emit('leave-outing', outingId)
      socket.disconnect()
    }
  }, [outingId])
}
