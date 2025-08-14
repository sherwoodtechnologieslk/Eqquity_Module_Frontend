# Equity Module UI

A React-based frontend for portfolio management with equity master data entry and management capabilities.

## Features

- **Equity Master Entry**: Add new equity securities with comprehensive details
- **Equity List View**: View, manage, and delete existing equities
- **Real-time Database Integration**: Save data directly to MySQL database
- **Responsive Design**: Works on desktop and mobile devices
- **Form Validation**: Ensures all required fields are completed
- **Success/Error Feedback**: Clear user feedback for all operations

## Prerequisites

Before running this application, ensure you have:

1. **Backend Server**: A Node.js/Express backend running on port 5000
2. **MySQL Database**: Database with the `equities` table
3. **Node.js**: Version 14 or higher

## Backend Requirements

Your backend should have the following API endpoints:

- `GET /api/equities` - Get all equities
- `POST /api/equities` - Create new equity
- `PUT /api/equities/:id` - Update equity
- `DELETE /api/equities/:id` - Delete equity

### Database Schema

The `equities` table should have the following structure:

```sql
CREATE TABLE equities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(20) NOT NULL,
  isin VARCHAR(20),
  sector VARCHAR(100),
  market VARCHAR(50),
  country VARCHAR(100),
  currency VARCHAR(10),
  isActive BOOLEAN DEFAULT true,
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Usage

### Adding New Equities

1. Navigate to the Equity Master Entry form
2. Fill in all required fields:
   - Company Name
   - Ticker Symbol
   - ISIN
   - Sector
   - Market
   - Country
   - Currency
3. Optionally add notes and set status
4. Click "Save Equity" to store in database

### Viewing Existing Equities

1. Click "View Existing Equities" button
2. See all saved equities in a table format
3. Use the "Delete" button to remove equities
4. Click "Refresh" to reload the data
5. Click "Back to Entry Form" to return to adding new equities

## API Configuration

The frontend is configured to connect to `http://localhost:5000/api`. If your backend runs on a different port or URL, update the `API_BASE_URL` in `src/services/api.js`.

## File Structure

```
src/
├── components/
│   └── MasterDataManagement/
│       ├── EquityMasterEntry.js      # Main entry form
│       ├── EquityMasterEntry.css     # Entry form styles
│       ├── EquityListView.js         # List view component
│       └── EquityListView.css        # List view styles
├── services/
│   └── api.js                        # API service functions
└── ...
```

## Troubleshooting

### Common Issues

1. **"Failed to fetch equities"**: Ensure your backend server is running on port 5000
2. **"Error saving equity"**: Check that your database is properly configured
3. **CORS errors**: Ensure your backend has CORS enabled

### Backend Setup

Make sure your backend includes:
- CORS middleware
- Body parser middleware
- Proper database connection
- Error handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
