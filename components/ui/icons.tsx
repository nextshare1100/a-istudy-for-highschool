import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  File,
  FileText,
  HelpCircle,
  Image,
  Laptop,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  Moon,
  MoreVertical,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  ShoppingCart,
  Sliders,
  Sun,
  Trash,
  TrendingUp,
  Trophy,
  Upload,
  User,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"

export type Icon = LucideIcon

export const Icons = {
  logo: Zap,
  close: X,
  spinner: Loader2,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
  trash: Trash,
  post: FileText,
  page: File,
  media: Image,
  settings: Settings,
  billing: CreditCard,
  ellipsis: MoreVertical,
  add: Plus,
  warning: AlertCircle,
  user: User,
  arrowRight: ArrowRight,
  help: HelpCircle,
  pizza: Package,
  sun: Sun,
  moon: Moon,
  laptop: Laptop,
  google: ({ ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      aria-hidden="true"
      focusable="false"
      data-prefix="fab"
      data-icon="google"
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 488 512"
      {...props}
    >
      <path
        fill="currentColor"
        d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
      ></path>
    </svg>
  ),
  apple: ({ ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
      />
    </svg>
  ),
  check: Check,
  copy: Copy,
  copyDone: Check,
  mail: Mail,
  lock: Lock,
  eye: Eye,
  eyeOff: EyeOff,
  menu: Menu,
  search: Search,
  upload: Upload,
  refreshCw: RefreshCw,
  clock: Clock,
  calendar: Calendar,
  bookOpen: BookOpen,
  trophy: Trophy,
  trendingUp: TrendingUp,
  users: Users,
  messageSquare: MessageSquare,
  shoppingCart: ShoppingCart,
  sliders: Sliders,
  shield: Shield,
  logOut: LogOut,
} as const