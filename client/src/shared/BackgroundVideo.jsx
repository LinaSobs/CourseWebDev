import { useEffect, useRef, useState } from 'react'
import { asset } from '../lib/asset'

// A muted looping video that sits behind a section, plus the button that pauses it.
// The parent section must be `relative isolate overflow-hidden`.
// Hidden for people who asked their device for less motion (they see the section colour instead).
export default function BackgroundVideo({
  src,
  poster,
  className = 'opacity-55',
  buttonClass = 'bg-ink/70 text-paper',
}) {
  const ref = useRef(null)
  // autoplay means it starts out playing
  const [playing, setPlaying] = useState(true)
  const userPaused = useRef(false)

  // a video nobody can see should not keep decoding frames: pause it off screen, resume on screen (unless the person paused it)
  useEffect(() => {
    const v = ref.current
    if (!v || typeof IntersectionObserver === 'undefined') return
    const watcher = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!userPaused.current) v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
    watcher.observe(v)
    return () => watcher.disconnect()
  }, [])

  function toggle() {
    const v = ref.current
    if (!v) return
    if (v.paused) {
      userPaused.current = false
      v.play().catch(() => {})
      setPlaying(true)
    } else {
      userPaused.current = true
      v.pause()
      setPlaying(false)
    }
  }

  return (
    <>
      <video
        ref={ref}
        className={`absolute inset-0 -z-20 h-full w-full object-cover motion-reduce:hidden ${className}`}
        src={asset(src)}
        poster={poster ? asset(poster) : undefined}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={!playing}
        className={`absolute right-4 bottom-4 z-10 min-h-11 rounded-full px-4 text-sm font-bold backdrop-blur motion-reduce:hidden ${buttonClass}`}
      >
        {playing ? 'Pause background' : 'Play background'}
      </button>
    </>
  )
}
