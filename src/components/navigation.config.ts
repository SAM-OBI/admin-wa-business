import {
  FiHome, FiPackage, FiUsers, FiShoppingBag,
  FiAlertCircle, FiMessageSquare, FiStar,
  FiShield, FiFileText, FiTrendingUp, FiMail,
  FiLock, FiTerminal, FiHash, FiSend, FiGitPullRequest, FiTruck, FiFlag
} from 'react-icons/fi';

export const navigationGroups: { label: string; items: { name: string; to: string; icon: typeof FiHome }[] }[] = [
  {
    label: 'Overview',
    items: [
      { name: 'Dashboard', to: '/dashboard', icon: FiHome },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { name: 'Products', to: '/dashboard/products', icon: FiPackage },
      { name: 'Orders', to: '/dashboard/orders', icon: FiShoppingBag },
      { name: 'App-Led Logistics', to: '/dashboard/logistics/app-led', icon: FiTruck },
      { name: 'Vendors', to: '/dashboard/vendors', icon: FiShoppingBag },
      { name: 'Users', to: '/dashboard/users', icon: FiUsers },
      { name: 'Product Moderation', to: '/dashboard/product-moderation', icon: FiPackage },
    ]
  },
  {
    label: 'Trust & Safety',
    items: [
      { name: 'Complaints', to: '/dashboard/complaints', icon: FiAlertCircle },
      { name: 'Disputes', to: '/dashboard/disputes', icon: FiFlag },
      { name: 'Court Cases', to: '/dashboard/court-cases', icon: FiMessageSquare },
      { name: 'Risk Management', to: '/dashboard/risk-management', icon: FiShield },
      { name: 'Security SOC', to: '/dashboard/security', icon: FiShield },
      { name: 'Governance', to: '/dashboard/governance', icon: FiLock },
      { name: 'Audit Logs', to: '/dashboard/audit-logs', icon: FiFileText },
      { name: 'Account Consolidations', to: '/dashboard/consolidations', icon: FiGitPullRequest },
    ]
  },
  {
    label: 'Engagement',
    items: [
      { name: 'Reviews', to: '/dashboard/reviews', icon: FiStar },
      { name: 'Platform Reviews', to: '/dashboard/platform-reviews', icon: FiStar },
      { name: 'App Feedback', to: '/dashboard/feedback', icon: FiMessageSquare },
      { name: 'Newsletter', to: '/dashboard/newsletter', icon: FiSend },
      { name: 'Journal Moderation', to: '/dashboard/journal', icon: FiFileText },
    ]
  },
  {
    label: 'Support',
    items: [
      { name: 'Support Inquiries', to: '/dashboard/support-inquiries', icon: FiMail },
      { name: 'Support', to: '/dashboard/support', icon: FiMail },
    ]
  },
  {
    label: 'Marketing & Ads',
    items: [
      { name: 'Marketing', to: '/dashboard/marketing', icon: FiTrendingUp },
      { name: 'Ads Moderation', to: '/dashboard/ads-moderation', icon: FiTrendingUp },
      { name: 'ROI Hub', to: '/dashboard/performance', icon: FiTrendingUp },
      { name: 'Promo Hub', to: '/dashboard/promo-hub', icon: FiTrendingUp },
    ]
  },
  {
    label: 'Finance',
    items: [
      { name: 'Financial Audit', to: '/dashboard/financial-audit', icon: FiTrendingUp },
      { name: 'Settlement', to: '/dashboard/settlement', icon: FiLock },
    ]
  },
  {
    label: 'System',
    items: [
      { name: 'Error Logs', to: '/dashboard/error-logs', icon: FiTerminal },
      { name: 'DLQ', to: '/dashboard/dlq', icon: FiHash },
    ]
  },
];
