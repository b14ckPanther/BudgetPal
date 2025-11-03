// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'BudgetPal';

  @override
  String get authWelcome => 'Welcome back';

  @override
  String get authRegisterTitle => 'Create your account';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get confirmPasswordLabel => 'Confirm password';

  @override
  String get signInButton => 'Sign in';

  @override
  String get signUpButton => 'Sign up';

  @override
  String get toggleToRegister => 'Need an account? Register';

  @override
  String get toggleToLogin => 'Already have an account? Sign in';

  @override
  String get rememberMeLabel => 'Remember me on this device';

  @override
  String get forgotPasswordLink => 'Forgot password?';

  @override
  String get authIdentifierLabel => 'Email or username';

  @override
  String get authIdentifierHelper =>
      'You can enter your email address or username.';

  @override
  String get authIdentifierRequired => 'Enter your email address or username.';

  @override
  String get usernameLabel => 'Username';

  @override
  String get usernameHelper =>
      '3+ characters. Letters, numbers, dot, dash, or underscore.';

  @override
  String get usernameRequiredError => 'Choose a username.';

  @override
  String get usernameInvalidError =>
      'Use at least 3 characters (letters, numbers, dot, dash, underscore).';

  @override
  String get passwordResetTitle => 'Reset password';

  @override
  String get passwordResetDescription =>
      'Enter your email to receive a password reset link.';

  @override
  String get passwordResetSendButton => 'Send reset link';

  @override
  String get passwordResetSuccess =>
      'Password reset email sent. Check your inbox.';

  @override
  String get retryButtonLabel => 'Try again';

  @override
  String get logoutButton => 'Sign out';

  @override
  String get loadingLabel => 'Loading...';

  @override
  String get themeToggleLabel => 'Theme';

  @override
  String get languageSelectorLabel => 'Language';

  @override
  String get invalidEmailError => 'Enter a valid email address';

  @override
  String get passwordMismatchError => 'Passwords do not match';

  @override
  String get passwordTooShortError => 'Password must be at least 6 characters';

  @override
  String get unknownError => 'Something went wrong';

  @override
  String get genericLoadError => 'We couldn\'t load this right now.';

  @override
  String get closeButtonTooltip => 'Close';

  @override
  String get passwordToggleShow => 'Show password';

  @override
  String get passwordToggleHide => 'Hide password';

  @override
  String get navHome => 'Home';

  @override
  String get navTransactions => 'Transactions';

  @override
  String get navBudget => 'Budget';

  @override
  String get navAssistant => 'Assistant';

  @override
  String get navProfile => 'Profile';

  @override
  String get homeOverviewTitle => 'Personal Finance Overview';

  @override
  String get homeOverviewSubtitle =>
      'Monitor your budgets, spending, and goals at a glance.';

  @override
  String get homePlaceholder => 'Dashboard widgets coming soon.';

  @override
  String get transactionsTitle => 'Transactions';

  @override
  String get transactionsSubtitle =>
      'Review recent activity, add purchases, and process invoices.';

  @override
  String get transactionsPlaceholder => 'Transaction list coming soon.';

  @override
  String get transactionsAddButton => 'Add transaction';

  @override
  String get transactionsImportInvoice => 'Process invoice (AI)';

  @override
  String get transactionsImportCamera => 'Capture invoice photo';

  @override
  String get transactionsImportGallery => 'Choose from gallery';

  @override
  String get transactionsSearchHint => 'Search notes or merchants';

  @override
  String get transactionsAiPickError =>
      'We couldn\'t access the camera or gallery. Check permissions and try again.';

  @override
  String get transactionsFilterReset => 'Clear filters';

  @override
  String get transactionsEmptyTitle => 'No transactions yet';

  @override
  String get transactionsEmptySubtitle =>
      'Start by adding your recent spending or income to stay on top of cash flow.';

  @override
  String get transactionsDateToday => 'Today';

  @override
  String get transactionsDateYesterday => 'Yesterday';

  @override
  String get transactionsDateEarlier => 'Earlier';

  @override
  String get transactionTypeExpense => 'Expense';

  @override
  String get transactionTypeIncome => 'Income';

  @override
  String get transactionFormTitleNew => 'Add transaction';

  @override
  String get transactionFormTitleEdit => 'Edit transaction';

  @override
  String get transactionFormAmountLabel => 'Amount';

  @override
  String get transactionFormAmountError =>
      'Enter a valid amount greater than zero';

  @override
  String get transactionFormCategoryLabel => 'Category';

  @override
  String get transactionFormTypeLabel => 'Type';

  @override
  String get transactionFormDateLabel => 'Date';

  @override
  String get transactionFormNoteLabel => 'Notes';

  @override
  String get transactionFormMerchantLabel => 'Merchant';

  @override
  String get transactionFormSave => 'Save';

  @override
  String get transactionFormUpdate => 'Update';

  @override
  String get transactionFormDelete => 'Delete';

  @override
  String get transactionDeleteConfirmTitle => 'Delete transaction';

  @override
  String get transactionDeleteConfirmMessage =>
      'Are you sure you want to remove this transaction? This action cannot be undone.';

  @override
  String get transactionDeleteConfirmConfirm => 'Delete';

  @override
  String get transactionDeleteConfirmCancel => 'Cancel';

  @override
  String get transactionsNoCategoriesHelper =>
      'Create a category first to classify this transaction.';

  @override
  String get transactionsAiProcessing => 'Processing invoice…';

  @override
  String get transactionsAiResultTitle => 'AI suggestions';

  @override
  String get transactionsAiNoResults =>
      'No items detected in the invoice. Try again with a clearer photo.';

  @override
  String get transactionsAiResultApply => 'Use suggestion';

  @override
  String get budgetTitle => 'Budget Envelopes';

  @override
  String get budgetSubtitle =>
      'Allocate every shekel and track remaining amounts in each category.';

  @override
  String get budgetPlaceholder => 'Budget envelopes coming soon.';

  @override
  String get budgetIncomeHeading => 'Income';

  @override
  String get budgetNeedsHeading => 'Needs';

  @override
  String get budgetWantsHeading => 'Wants';

  @override
  String get budgetLoansHeading => 'Loans';

  @override
  String get budgetTotalsIncomeReceived => 'Income received';

  @override
  String get budgetTotalsBudgeted => 'Budgeted';

  @override
  String get budgetTotalsSpent => 'Spent';

  @override
  String get budgetTotalsAvailable => 'Available to budget';

  @override
  String get budgetAddCategory => 'Add category';

  @override
  String get budgetEditCategory => 'Edit category';

  @override
  String get budgetNoCategoriesTitle => 'No budget envelopes yet';

  @override
  String get budgetNoCategoriesSubtitle =>
      'Create your first category to start allocating every shekel with Zero-Based Budgeting.';

  @override
  String get budgetCategoryNameLabel => 'Category name';

  @override
  String get budgetCategoryTargetLabel => 'Target amount';

  @override
  String get budgetCategoryTypeLabel => 'Type';

  @override
  String get budgetCategoryTypeNeed => 'Need';

  @override
  String get budgetCategoryTypeWant => 'Want';

  @override
  String get budgetCategoryTypeLoan => 'Loan';

  @override
  String get budgetCategoryTypeIncome => 'Income';

  @override
  String get budgetCategorySave => 'Save';

  @override
  String get budgetCategoryUpdate => 'Update';

  @override
  String get budgetCategoryDelete => 'Delete';

  @override
  String get budgetCategoryDeleteConfirmTitle => 'Delete category';

  @override
  String get budgetCategoryDeleteConfirmMessage =>
      'Deleting this category will remove its budget target. Existing transactions remain untouched.';

  @override
  String get budgetCategoryDeleteConfirmCancel => 'Cancel';

  @override
  String get budgetCategoryDeleteConfirmConfirm => 'Delete';

  @override
  String get budgetCategoryAmountError =>
      'Enter a valid amount greater than zero';

  @override
  String get assistantTitle => 'BudgetPal Assistant';

  @override
  String get assistantSubtitle =>
      'Ask for help with budgets, transactions, and app settings.';

  @override
  String get assistantPlaceholder =>
      'What would you like to know about BudgetPal?';

  @override
  String get assistantSuggestedHeading => 'Try asking about:';

  @override
  String get assistantSuggestedTransactions =>
      'How do I add a new transaction?';

  @override
  String get assistantSuggestedBudget => 'What do the budget sections mean?';

  @override
  String get assistantSuggestedInvoice => 'How does AI invoice import work?';

  @override
  String get assistantThinking => 'Thinking…';

  @override
  String get assistantProviderMissing =>
      'Connect BudgetPal to an AI provider to unlock smarter answers.';

  @override
  String get assistantApiError =>
      'I ran into a problem reaching our AI service.';

  @override
  String get assistantFallbackIntro =>
      'Here\'s a quick BudgetPal tip meanwhile:';

  @override
  String get assistantClearChat => 'Clear chat';

  @override
  String get assistantInputHint => 'Type your question about BudgetPal';

  @override
  String get assistantCannotAnswer =>
      'I can help with BudgetPal features. Try asking about budgets, transactions, or settings.';

  @override
  String get assistantSendButton => 'Send';

  @override
  String get profileTitle => 'Profile & Settings';

  @override
  String get profileSubtitle =>
      'Manage your account details, balances, and preferences.';

  @override
  String get profilePlaceholder => 'Profile settings coming soon.';

  @override
  String get profileFinancialSectionTitle => 'Balances';

  @override
  String get profileFinancialSectionDescription =>
      'Update your current bank balance and available overdraft.';

  @override
  String get profileBankBalanceLabel => 'Bank balance';

  @override
  String get profileBankBalanceInvalid => 'Enter a valid balance.';

  @override
  String get profileOverdraftLabel => 'Overdraft limit';

  @override
  String get profileOverdraftInvalid =>
      'Enter a valid overdraft of zero or more.';

  @override
  String get profileOverdraftHelper =>
      'Enter the maximum overdraft you can access. Leave 0 if it does not apply.';

  @override
  String get profileFormSave => 'Save changes';

  @override
  String get profileFormReset => 'Revert';

  @override
  String get profileUpdateSuccess => 'Profile updated successfully.';

  @override
  String get profileUpdateError =>
      'We couldn\'t update your profile. Try again shortly.';

  @override
  String get profilePreferencesSectionTitle => 'Preferences';

  @override
  String get profileThemeOptionLight => 'Light';

  @override
  String get profileThemeOptionDark => 'Dark';

  @override
  String get profileThemeOptionSystem => 'System';

  @override
  String get profileLocaleLabel => 'Language';

  @override
  String get profileAccountSectionTitle => 'Account';

  @override
  String get profileAccountEmailLabel => 'Email';

  @override
  String get profileResetPasswordButton => 'Send password reset';

  @override
  String get profilePasswordResetSent => 'Password reset email sent.';

  @override
  String get profilePasswordResetError =>
      'We couldn\'t send the reset email. Try again later.';

  @override
  String get profileSignOutConfirmTitle => 'Sign out?';

  @override
  String get profileSignOutConfirmMessage =>
      'You\'ll return to the sign-in screen. Unsaved changes will be lost.';

  @override
  String get profileSignOutConfirmConfirm => 'Sign out';

  @override
  String get profileSignOutConfirmCancel => 'Stay';

  @override
  String get authErrorInvalidCredentials =>
      'The email or password you entered is incorrect.';

  @override
  String get authErrorUserDisabled =>
      'This account has been disabled. Contact support if this is unexpected.';

  @override
  String get authErrorUserNotFound =>
      'No account exists for that email address.';

  @override
  String get authErrorTooManyRequests =>
      'Too many attempts. Please try again later.';

  @override
  String get authErrorEmailAlreadyInUse =>
      'An account already exists with this email address.';

  @override
  String get authErrorWeakPassword =>
      'Choose a stronger password to protect your account.';

  @override
  String get authErrorUsernameTaken => 'That username is already taken.';

  @override
  String get authErrorUnknown =>
      'Unable to complete the request. Try again in a moment.';
}
