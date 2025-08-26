# Dashboard Component

## Overview
The Dashboard component serves as the main landing page after user authentication, providing a comprehensive overview of portfolio performance, recent transactions, and market insights.

## Features

### Key Metrics
- **Portfolio Value**: Total current portfolio value
- **Total P&L**: Profit and loss summary
- **Active Positions**: Number of active portfolio positions
- **Market Status**: Current market trading status

### Dashboard Widgets
1. **Recent Transactions**: Latest buy/sell activities
2. **Top Performers**: Best performing equities
3. **Market Alerts**: Important market notifications
4. **Quick Actions**: Fast access to key functions

## Integration

### Frontend
- Located at: `src/components/Dashboard/`
- Main component: `Dashboard.js`
- Styling: `Dashboard.css`
- Export: `index.js`

### Backend
- API routes: `routes/dashboardRoutes.js`
- Endpoints:
  - `GET /api/dashboard/overview` - Main dashboard data
  - `GET /api/dashboard/performance` - Performance metrics
  - `GET /api/dashboard/market-summary` - Market data

### Navigation
- Added as first item in sidebar navigation
- Default landing page after login
- Accessible via "Dashboard" menu item

## Data Flow

1. **User Login** → Redirected to Dashboard
2. **Dashboard Load** → Fetches data from `/api/dashboard/overview`
3. **Real-time Updates** → Data refreshes on component mount
4. **Fallback Data** → Mock data if API unavailable

## Customization

### Adding New Widgets
1. Create widget component in `DashboardWidgets/` folder
2. Add to dashboard grid in `Dashboard.js`
3. Update CSS for responsive layout

### API Integration
1. Add new endpoint in `dashboardRoutes.js`
2. Update `loadDashboardData()` function
3. Handle new data in component state

## Styling

The dashboard uses a modern, responsive design with:
- CSS Grid for layout
- Flexbox for component alignment
- Tailwind-inspired color scheme
- Hover effects and transitions
- Mobile-responsive breakpoints

## Future Enhancements

- Real-time data updates via WebSocket
- Interactive charts and graphs
- Customizable widget layout
- Export functionality for reports
- Dark/light theme toggle
