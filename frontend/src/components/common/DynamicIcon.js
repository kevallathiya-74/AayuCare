import React from 'react';
// Direct named imports enable tree-shaking with Metro bundler
// avoids importing all ~1,550 lucide-react-native icons
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Banknote,
  Battery,
  Bone,
  BookOpen,
  BriefcaseMedical,
  Building2,
  Calendar,
  CheckCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  Clock,
  CloudOff,
  CreditCard,
  Droplets,
  Eye,
  EyeOff,
  FileText,
  Fingerprint,
  Flame,
  FlaskConical,
  Flower2,
  FolderOpen,
  Footprints,
  Frown,
  Heart,
  Hospital,
  House,
  Image,
  Info,
  Languages,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Lightbulb,
  Lock,
  LogOut,
  MapPin,
  MicOff,
  Music,
  Paperclip,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Skull,
  Smartphone,
  Smile,
  Star,
  Stethoscope,
  TrendingDown,
  TrendingUp,
  User,
  UserCircle,
  UserPlus,
  Users,
  Utensils,
  Venus,
  VenusAndMars,
  X,
  XCircle,
} from 'lucide-react-native';

const ICON_MAP = {
  activity: Activity,
  alertcircle: AlertCircle,
  alerttriangle: AlertTriangle,
  arrowleft: ArrowLeft,
  arrowright: ArrowRight,
  award: Award,
  banknote: Banknote,
  battery: Battery,
  bone: Bone,
  bookopen: BookOpen,
  briefcasemedical: BriefcaseMedical,
  building2: Building2,
  calendar: Calendar,
  checkcheck: CheckCheck,
  checkcircle2: CheckCircle2,
  chevronleft: ChevronLeft,
  chevronright: ChevronRight,
  chevronup: ChevronUp,
  chevrondown: ChevronDown,
  circlehelp: CircleHelp,
  clock: Clock,
  cloudoff: CloudOff,
  creditcard: CreditCard,
  droplets: Droplets,
  eye: Eye,
  eyeoff: EyeOff,
  filetext: FileText,
  fingerprint: Fingerprint,
  flame: Flame,
  flaskconical: FlaskConical,
  flower2: Flower2,
  folderopen: FolderOpen,
  footprints: Footprints,
  frown: Frown,
  heart: Heart,
  hospital: Hospital,
  house: House,
  image: Image,
  info: Info,
  languages: Languages,
  layoutdashboard: LayoutDashboard,
  layoutgrid: LayoutGrid,
  library: Library,
  lightbulb: Lightbulb,
  lock: Lock,
  logout: LogOut,
  mappin: MapPin,
  micoff: MicOff,
  music: Music,
  paperclip: Paperclip,
  pencil: Pencil,
  phone: Phone,
  refreshcw: RefreshCw,
  search: Search,
  server: Server,
  settings: Settings,
  shield: Shield,
  shieldcheck: ShieldCheck,
  skull: Skull,
  smartphone: Smartphone,
  smile: Smile,
  star: Star,
  stethoscope: Stethoscope,
  trendingdown: TrendingDown,
  trendingup: TrendingUp,
  user: User,
  usercircle: UserCircle,
  userplus: UserPlus,
  users: Users,
  utensils: Utensils,
  venus: Venus,
  venusandmars: VenusAndMars,
  x: X,
  xcircle: XCircle,
};

const LEGACY_ICON_ALIASES = {
  apps: 'layoutgrid',
  'apps-outline': 'layoutgrid',
  book: 'bookopen',
  'briefcase-medical': 'briefcasemedical',
  'bulb-outline': 'lightbulb',
  'body-outline': 'bone',
  'battery-dead': 'battery',
  'business-outline': 'building2',
  calendar: 'calendar',
  'calendar-outline': 'calendar',
  call: 'phone',
  'call-outline': 'phone',
  card: 'creditcard',
  cash: 'banknote',
  close: 'x',
  'close-circle': 'xcircle',
  'chevron-forward': 'chevronright',
  'chevron-forward-outline': 'chevronright',
  'chevron-back': 'chevronleft',
  'chevron-back-outline': 'chevronleft',
  'chevron-up': 'chevronup',
  'chevron-up-outline': 'chevronup',
  'chevron-down': 'chevrondown',
  'chevron-down-outline': 'chevrondown',
  'arrow-forward': 'arrowright',
  'arrow-forward-outline': 'arrowright',
  'arrow-back': 'arrowleft',
  'arrow-back-outline': 'arrowleft',
  'cloud-offline-outline': 'cloudoff',
  'create-outline': 'pencil',
  'document-text': 'filetext',
  'document-text-outline': 'filetext',
  flame: 'flame',
  eye: 'eye',
  'eye-outline': 'eye',
  'eye-off-outline': 'eyeoff',
  fitness: 'activity',
  'fitness-outline': 'activity',
  flask: 'flaskconical',
  'folder-open': 'folderopen',
  grid: 'layoutgrid',
  'grid-outline': 'layoutgrid',
  'happy-outline': 'smile',
  'heart-outline': 'heart',
  hospital: 'hospital',
  'home-outline': 'house',
  home: 'house',
  'information-circle': 'info',
  'information-circle-outline': 'info',
  language: 'languages',
  library: 'library',
  'library-outline': 'library',
  'lock-closed': 'lock',
  'lock-closed-outline': 'lock',
  'log-out-outline': 'logout',
  settings: 'settings',
  'settings-outline': 'settings',
  medical: 'stethoscope',
  'medical-outline': 'stethoscope',
  medkit: 'briefcasemedical',
  'mic-off': 'micoff',
  'musical-notes': 'music',
  people: 'users',
  'people-outline': 'users',
  'person-add': 'userplus',
  person: 'user',
  'person-outline': 'user',
  'person-circle': 'usercircle',
  'person-circle-outline': 'usercircle',
  paperclip: 'paperclip',
  'phone-portrait': 'smartphone',
  pulse: 'activity',
  refresh: 'refreshcw',
  'refresh-cw': 'refreshcw',
  restaurant: 'utensils',
  ribbon: 'award',
  'rose-outline': 'flower2',
  sad: 'frown',
  'search-outline': 'search',
  'server-outline': 'server',
  'shield-checkmark': 'shieldcheck',
  'shield-checkmark-outline': 'shieldcheck',
  shield: 'shield',
  'skull-outline': 'skull',
  'stats-chart': 'trendingup',
  'time-outline': 'clock',
  time: 'clock',
  water: 'droplets',
  'water-outline': 'droplets',
  'image-outline': 'image',
  walk: 'footprints',
  warning: 'alerttriangle',
  woman: 'venus',
  'male-female': 'venusandmars',
  location: 'mappin',
  'location-outline': 'mappin',
  'finger-print': 'fingerprint',
  'folder-open-outline': 'folderopen',
  x: 'x',
  'checkmark-circle': 'checkcircle2',
  'checkmark-done': 'checkcheck',
  star: 'star',
  'star-outline': 'star',
  'help-circle': 'circlehelp',
  'help-circle-outline': 'circlehelp',
  'alert-circle': 'alertcircle',
  'alert-circle-outline': 'alertcircle',
  dashboard: 'layoutdashboard',
  'dashboard-outline': 'layoutdashboard',
  'layout-dashboard': 'layoutdashboard',
  'layout-dashboard-outline': 'layoutdashboard',
  'trending-up': 'trendingup',
  'trending-down': 'trendingdown',
  'trending_up': 'trendingup',
  'trending_down': 'trendingdown',
};

const sanitizeLegacyName = (rawName) =>
  rawName
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-fill$/i, '')
    .replace(/-sharp$/i, '')
    .replace(/_fill$/i, '')
    .replace(/_sharp$/i, '');

const toPascalCase = (value) =>
  value
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

const resolveLucideName = (name) => {
  const sanitized = sanitizeLegacyName(name);
  const normalized = sanitized.toLowerCase();

  if (LEGACY_ICON_ALIASES[normalized]) {
    return LEGACY_ICON_ALIASES[normalized];
  }

  const directKey = normalized.replace(/[-_]/g, '');
  if (ICON_MAP[directKey]) {
    return directKey;
  }

  const pascalName = toPascalCase(sanitized)
    .replace(/Outline$/i, '')
    .replace(/Sharp$/i, '');
  const pascalLower = pascalName.toLowerCase();
  const pascalKey = pascalLower.replace(/[-_]/g, '');
  if (ICON_MAP[pascalKey]) {
    return pascalKey;
  }

  return 'circlehelp';
};

const isRenderableComponentType = (value) => {
  if (!value) return false;
  if (typeof value === 'function') return true;
  if (typeof value !== 'object') return false;
  return !!value.$$typeof || typeof value.render === 'function';
};

const DynamicIcon = ({ name, size = 24, color = 'black', ...props }) => {
  if (!name) return null;

  if (React.isValidElement(name)) {
    return React.cloneElement(name, { size, color, ...props });
  }

  if (isRenderableComponentType(name)) {
    const IconComponent = name;
    return <IconComponent size={size} color={color} {...props} />;
  }

  if (typeof name !== 'string') {
    return <CircleHelp size={size} color={color} {...props} />;
  }

  const resolvedName = resolveLucideName(name);
  const IconComponent = ICON_MAP[resolvedName] || CircleHelp;

  return <IconComponent size={size} color={color} {...props} />;
};

export default DynamicIcon;
