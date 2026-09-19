import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/log', label: 'Log', icon: 'dumbbell' },
  { to: '/history', label: 'History', icon: 'chart' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];

export function BottomNav() {
  return (
    <nav className="nav">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => (isActive ? 'active' : undefined)}
        >
          {({ isActive }) => (
            <>
              <Icon name={tab.icon} size={19} strokeWidth={isActive ? 2.5 : 2} />
              <span>{tab.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
