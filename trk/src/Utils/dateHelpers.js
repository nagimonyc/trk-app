// Helper function to format the date into a readable format (Eastern Time)
export const formatDateToEasternTime = (unixTimestamp) => {
    const date = new Date(unixTimestamp * 1000);
    return date.toLocaleString('en-US', { timeZone: 'America/New_York', month: 'long', day: 'numeric' });
};

// Helper function to calculate the number of days between two dates
export const calculateDaysBetween = (date1, date2) => {
    const diffInMs = Math.abs(date2 - date1); // Difference in milliseconds
    return Math.floor(diffInMs / (1000 * 60 * 60 * 24)); // Convert milliseconds to days
};

// Function to format a date in YYYY-MM-DD format for consistent display
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};