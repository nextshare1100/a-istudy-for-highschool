export default function MathDisplay({ content }: { content: string }) {
  return <div dangerouslySetInnerHTML={{ __html: content }} />
}
