import { useParams, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import AnimationEditor from '../components/editor/AnimationEditor'
import useStoryStore from '../store/useStoryStore'

export default function AnimationEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const getAnimation = useStoryStore((s) => s.getAnimation)
  const animation = getAnimation(id)

  useEffect(() => {
    if (!animation) navigate('/editor', { replace: true })
  }, [animation, navigate])

  if (!animation) return null

  return <AnimationEditor animation={animation} />
}
