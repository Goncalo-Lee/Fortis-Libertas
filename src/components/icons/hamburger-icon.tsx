import { Icon } from '@/src/components/ui/icon'

export function HamburgerIcon(props: React.ComponentProps<typeof Icon>) {
  return (
    <Icon
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 7L7 7M20 7L11 7" />
      <path d="M20 17H17M4 17L13 17" />
      <path d="M4 12H7L20 12" />
    </Icon>
  )
}
