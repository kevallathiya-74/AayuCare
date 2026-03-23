/**
 * AayuCare - Dynamic Icon Component
 * 
 * Maps string names to Lucide icons.
 * This is useful when icon names are stored in a database or received from an API.
 */

import React from 'react';
import * as LucideIcons from 'lucide-react-native';

const LUCIDE_NAME_LOOKUP = Object.keys(LucideIcons).reduce((acc, iconName) => {
  acc[iconName.toLowerCase()] = iconName;
  return acc;
}, {});

const LEGACY_ICON_ALIASES = {
  apps: 'LayoutGrid',
  'apps-outline': 'LayoutGrid',
  book: 'BookOpen',
  'briefcase-medical': 'BriefcaseMedical',
  'bulb-outline': 'Lightbulb',
  'body-outline': 'Bone',
  'battery-dead': 'Battery',
  'business-outline': 'Building2',
  calendar: 'Calendar',
  'calendar-outline': 'Calendar',
  call: 'Phone',
  'call-outline': 'Phone',
  card: 'CreditCard',
  cash: 'Banknote',
  close: 'X',
  'close-circle': 'XCircle',
  'chevron-forward': 'ChevronRight',
  'chevron-forward-outline': 'ChevronRight',
  'chevron-back': 'ChevronLeft',
  'chevron-back-outline': 'ChevronLeft',
  'chevron-up': 'ChevronUp',
  'chevron-up-outline': 'ChevronUp',
  'chevron-down': 'ChevronDown',
  'chevron-down-outline': 'ChevronDown',
  'arrow-forward': 'ArrowRight',
  'arrow-forward-outline': 'ArrowRight',
  'arrow-back': 'ArrowLeft',
  'arrow-back-outline': 'ArrowLeft',
  'cloud-offline-outline': 'CloudOff',
  'create-outline': 'Pencil',
  'document-text': 'FileText',
  'document-text-outline': 'FileText',
  flame: 'Flame',
  eye: 'Eye',
  'eye-outline': 'Eye',
  'eye-off-outline': 'EyeOff',
  fitness: 'Activity',
  'fitness-outline': 'Activity',
  flask: 'FlaskConical',
  'folder-open': 'FolderOpen',
  grid: 'LayoutGrid',
  'grid-outline': 'LayoutGrid',
  'happy-outline': 'Smile',
  'heart-outline': 'Heart',
  hospital: 'Hospital',
  'home-outline': 'House',
  home: 'House',
  'information-circle': 'Info',
  'information-circle-outline': 'Info',
  language: 'Languages',
  library: 'Library',
  'library-outline': 'Library',
  'lock-closed': 'Lock',
  'lock-closed-outline': 'Lock',
  'log-out-outline': 'LogOut',
  settings: 'Settings',
  'settings-outline': 'Settings',
  medical: 'Stethoscope',
  'medical-outline': 'Stethoscope',
  medkit: 'BriefcaseMedical',
  'mic-off': 'MicOff',
  'musical-notes': 'Music',
  people: 'Users',
  'people-outline': 'Users',
  'person-add': 'UserPlus',
  person: 'User',
  'person-outline': 'User',
  'person-circle': 'UserCircle',
  'person-circle-outline': 'UserCircle',
  paperclip: 'Paperclip',
  'phone-portrait': 'Smartphone',
  pulse: 'Activity',
  refresh: 'RefreshCw',
  'refresh-cw': 'RefreshCw',
  restaurant: 'Utensils',
  ribbon: 'Award',
  'rose-outline': 'Flower2',
  sad: 'Frown',
  'search-outline': 'Search',
  'server-outline': 'Server',
  'shield-checkmark': 'ShieldCheck',
  'shield-checkmark-outline': 'ShieldCheck',
  shield: 'Shield',
  'skull-outline': 'Skull',
  'stats-chart': 'TrendingUp',
  'time-outline': 'Clock',
  time: 'Clock',
  water: 'Droplets',
  'water-outline': 'Droplets',
  'image-outline': 'Image',
  walk: 'Footprints',
  warning: 'AlertTriangle',
  woman: 'Venus',
  'male-female': 'VenusAndMars',
  location: 'MapPin',
  'location-outline': 'MapPin',
  'finger-print': 'Fingerprint',
  'folder-open-outline': 'FolderOpen',
  x: 'X',
  'checkmark-circle': 'CheckCircle2',
  'checkmark-done': 'CheckCheck',
  star: 'Star',
  'star-outline': 'Star',
  'help-circle': 'CircleHelp',
  'help-circle-outline': 'CircleHelp',
  'alert-circle': 'AlertCircle',
  'alert-circle-outline': 'AlertCircle',
  dashboard: 'LayoutDashboard',
  'dashboard-outline': 'LayoutDashboard',
  'layout-dashboard': 'LayoutDashboard',
  'layout-dashboard-outline': 'LayoutDashboard',
  'trending-up': 'TrendingUp',
  'trending-down': 'TrendingDown',
  'trending_up': 'TrendingUp',
  'trending_down': 'TrendingDown',
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

  if (LUCIDE_NAME_LOOKUP[normalized]) {
    return LUCIDE_NAME_LOOKUP[normalized];
  }

  const pascalName = toPascalCase(sanitized)
    .replace(/Outline$/i, '')
    .replace(/Sharp$/i, '');
  const pascalLower = pascalName.toLowerCase();

  if (LUCIDE_NAME_LOOKUP[pascalLower]) {
    return LUCIDE_NAME_LOOKUP[pascalLower];
  }

  return 'CircleHelp';
};

const isRenderableComponentType = (value) => {
  if (!value) return false;
  if (typeof value === 'function') return true;
  if (typeof value !== 'object') return false;
  // React.forwardRef / memo components are objects and still valid element types.
  return !!value.$$typeof || typeof value.render === 'function';
};

/**
 * DynamicIcon Component
 * @param {string} name - The name of the icon (camelCase or kebab-case)
 * @param {number} size - Icon size
 * @param {string} color - Icon color
 * @param {object} props - Additional props for the Lucide component
 */
const DynamicIcon = ({ name, size = 24, color = 'black', ...props }) => {
  if (!name) return null;

  // Allow passing an already created icon element.
  if (React.isValidElement(name)) {
    return React.cloneElement(name, { size, color, ...props });
  }

  // Allow passing a Lucide component directly (e.g., icon: Calendar)
  if (isRenderableComponentType(name)) {
    const IconComponent = name;
    return <IconComponent size={size} color={color} {...props} />;
  }

  // Guard against non-string values to avoid runtime crashes
  if (typeof name !== 'string') {
    const IconComponent = LucideIcons.CircleHelp;
    return <IconComponent size={size} color={color} {...props} />;
  }

  const resolvedName = resolveLucideName(name);
  const IconComponent = LucideIcons[resolvedName] || LucideIcons.CircleHelp;

  return <IconComponent size={size} color={color} {...props} />;
};

export default DynamicIcon;
