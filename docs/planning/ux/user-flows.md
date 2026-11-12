# User Flows

Key interaction paths in **Fortis Libertas**.

## 1. Onboarding & Authentication

1. **Sign Up**:
   - User enters email, full name, and password.
   - User receives a verification email.
   - User confirms email &rarr; Redirected to Sign In.
2. **Sign In**:
   - User enters credentials.
   - If 2FA is enabled &rarr; Prompt for code.
   - On success &rarr; Redirected to default Dashboard.

## 2. Managing Financial Records

1. **Logging an Expense**:
   - User clicks "Add Record" on Dashboard.
   - Selects "Expense" type.
   - Chooses Category (e.g., Food).
   - Enters Amount, Currency, and Payment Method (e.g., Credit Card).
   - (Optional) Attaches Tags.
   - Clicks "Save".
2. **Reviewing History**:
   - User navigates to Transactions list.
   - Filters by date, category, or status.
   - Clicks a record to view details or edit.

## 3. Collaborative Dashboards

1. **Inviting a Member**:
   - Dashboard Owner goes to Settings &rarr; Members.
   - Enters the invitee's email and chooses a Role (Editor/Viewer).
   - Invitee receives notification/email.
2. **Switching Dashboards**:
   - User clicks the dashboard selector in the navigation bar.
   - Selects a different workspace from the list of memberships.

## 4. Multi-Currency Conversion

1. **Entering a Non-Default Currency**:
   - User creates a record in USD (while dashboard is EUR).
   - System fetches the current exchange rate from Frankfurter.
   - Record is saved with original amount and currency.
   - Dashboard balance/reports show the converted value in EUR.
