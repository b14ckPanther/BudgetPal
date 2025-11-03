import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';
import 'app_localizations_he.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
    Locale('he'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'BudgetPal'**
  String get appTitle;

  /// No description provided for @authWelcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome back'**
  String get authWelcome;

  /// No description provided for @authRegisterTitle.
  ///
  /// In en, this message translates to:
  /// **'Create your account'**
  String get authRegisterTitle;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @passwordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get passwordLabel;

  /// No description provided for @confirmPasswordLabel.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirmPasswordLabel;

  /// No description provided for @signInButton.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signInButton;

  /// No description provided for @signUpButton.
  ///
  /// In en, this message translates to:
  /// **'Sign up'**
  String get signUpButton;

  /// No description provided for @toggleToRegister.
  ///
  /// In en, this message translates to:
  /// **'Need an account? Register'**
  String get toggleToRegister;

  /// No description provided for @toggleToLogin.
  ///
  /// In en, this message translates to:
  /// **'Already have an account? Sign in'**
  String get toggleToLogin;

  /// No description provided for @rememberMeLabel.
  ///
  /// In en, this message translates to:
  /// **'Remember me on this device'**
  String get rememberMeLabel;

  /// No description provided for @forgotPasswordLink.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPasswordLink;

  /// No description provided for @authIdentifierLabel.
  ///
  /// In en, this message translates to:
  /// **'Email or username'**
  String get authIdentifierLabel;

  /// No description provided for @authIdentifierHelper.
  ///
  /// In en, this message translates to:
  /// **'You can enter your email address or username.'**
  String get authIdentifierHelper;

  /// No description provided for @authIdentifierRequired.
  ///
  /// In en, this message translates to:
  /// **'Enter your email address or username.'**
  String get authIdentifierRequired;

  /// No description provided for @usernameLabel.
  ///
  /// In en, this message translates to:
  /// **'Username'**
  String get usernameLabel;

  /// No description provided for @usernameHelper.
  ///
  /// In en, this message translates to:
  /// **'3+ characters. Letters, numbers, dot, dash, or underscore.'**
  String get usernameHelper;

  /// No description provided for @usernameRequiredError.
  ///
  /// In en, this message translates to:
  /// **'Choose a username.'**
  String get usernameRequiredError;

  /// No description provided for @usernameInvalidError.
  ///
  /// In en, this message translates to:
  /// **'Use at least 3 characters (letters, numbers, dot, dash, underscore).'**
  String get usernameInvalidError;

  /// No description provided for @passwordResetTitle.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get passwordResetTitle;

  /// No description provided for @passwordResetDescription.
  ///
  /// In en, this message translates to:
  /// **'Enter your email to receive a password reset link.'**
  String get passwordResetDescription;

  /// No description provided for @passwordResetSendButton.
  ///
  /// In en, this message translates to:
  /// **'Send reset link'**
  String get passwordResetSendButton;

  /// No description provided for @passwordResetSuccess.
  ///
  /// In en, this message translates to:
  /// **'Password reset email sent. Check your inbox.'**
  String get passwordResetSuccess;

  /// No description provided for @retryButtonLabel.
  ///
  /// In en, this message translates to:
  /// **'Try again'**
  String get retryButtonLabel;

  /// No description provided for @logoutButton.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get logoutButton;

  /// No description provided for @loadingLabel.
  ///
  /// In en, this message translates to:
  /// **'Loading...'**
  String get loadingLabel;

  /// No description provided for @themeToggleLabel.
  ///
  /// In en, this message translates to:
  /// **'Theme'**
  String get themeToggleLabel;

  /// No description provided for @languageSelectorLabel.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageSelectorLabel;

  /// No description provided for @invalidEmailError.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email address'**
  String get invalidEmailError;

  /// No description provided for @passwordMismatchError.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwordMismatchError;

  /// No description provided for @passwordTooShortError.
  ///
  /// In en, this message translates to:
  /// **'Password must be at least 6 characters'**
  String get passwordTooShortError;

  /// No description provided for @unknownError.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong'**
  String get unknownError;

  /// No description provided for @genericLoadError.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t load this right now.'**
  String get genericLoadError;

  /// No description provided for @closeButtonTooltip.
  ///
  /// In en, this message translates to:
  /// **'Close'**
  String get closeButtonTooltip;

  /// No description provided for @passwordToggleShow.
  ///
  /// In en, this message translates to:
  /// **'Show password'**
  String get passwordToggleShow;

  /// No description provided for @passwordToggleHide.
  ///
  /// In en, this message translates to:
  /// **'Hide password'**
  String get passwordToggleHide;

  /// No description provided for @navHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get navHome;

  /// No description provided for @navTransactions.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get navTransactions;

  /// No description provided for @navBudget.
  ///
  /// In en, this message translates to:
  /// **'Budget'**
  String get navBudget;

  /// No description provided for @navAssistant.
  ///
  /// In en, this message translates to:
  /// **'Assistant'**
  String get navAssistant;

  /// No description provided for @navProfile.
  ///
  /// In en, this message translates to:
  /// **'Profile'**
  String get navProfile;

  /// No description provided for @homeOverviewTitle.
  ///
  /// In en, this message translates to:
  /// **'Personal Finance Overview'**
  String get homeOverviewTitle;

  /// No description provided for @homeOverviewSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Monitor your budgets, spending, and goals at a glance.'**
  String get homeOverviewSubtitle;

  /// No description provided for @homePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Dashboard widgets coming soon.'**
  String get homePlaceholder;

  /// No description provided for @transactionsTitle.
  ///
  /// In en, this message translates to:
  /// **'Transactions'**
  String get transactionsTitle;

  /// No description provided for @transactionsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Review recent activity, add purchases, and process invoices.'**
  String get transactionsSubtitle;

  /// No description provided for @transactionsPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Transaction list coming soon.'**
  String get transactionsPlaceholder;

  /// No description provided for @transactionsAddButton.
  ///
  /// In en, this message translates to:
  /// **'Add transaction'**
  String get transactionsAddButton;

  /// No description provided for @transactionsImportInvoice.
  ///
  /// In en, this message translates to:
  /// **'Process invoice (AI)'**
  String get transactionsImportInvoice;

  /// No description provided for @transactionsImportCamera.
  ///
  /// In en, this message translates to:
  /// **'Capture invoice photo'**
  String get transactionsImportCamera;

  /// No description provided for @transactionsImportGallery.
  ///
  /// In en, this message translates to:
  /// **'Choose from gallery'**
  String get transactionsImportGallery;

  /// No description provided for @transactionsSearchHint.
  ///
  /// In en, this message translates to:
  /// **'Search notes or merchants'**
  String get transactionsSearchHint;

  /// No description provided for @transactionsAiPickError.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t access the camera or gallery. Check permissions and try again.'**
  String get transactionsAiPickError;

  /// No description provided for @transactionsFilterReset.
  ///
  /// In en, this message translates to:
  /// **'Clear filters'**
  String get transactionsFilterReset;

  /// No description provided for @transactionsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'No transactions yet'**
  String get transactionsEmptyTitle;

  /// No description provided for @transactionsEmptySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Start by adding your recent spending or income to stay on top of cash flow.'**
  String get transactionsEmptySubtitle;

  /// No description provided for @transactionsDateToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get transactionsDateToday;

  /// No description provided for @transactionsDateYesterday.
  ///
  /// In en, this message translates to:
  /// **'Yesterday'**
  String get transactionsDateYesterday;

  /// No description provided for @transactionsDateEarlier.
  ///
  /// In en, this message translates to:
  /// **'Earlier'**
  String get transactionsDateEarlier;

  /// No description provided for @transactionTypeExpense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get transactionTypeExpense;

  /// No description provided for @transactionTypeIncome.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get transactionTypeIncome;

  /// No description provided for @transactionFormTitleNew.
  ///
  /// In en, this message translates to:
  /// **'Add transaction'**
  String get transactionFormTitleNew;

  /// No description provided for @transactionFormTitleEdit.
  ///
  /// In en, this message translates to:
  /// **'Edit transaction'**
  String get transactionFormTitleEdit;

  /// No description provided for @transactionFormAmountLabel.
  ///
  /// In en, this message translates to:
  /// **'Amount'**
  String get transactionFormAmountLabel;

  /// No description provided for @transactionFormAmountError.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid amount greater than zero'**
  String get transactionFormAmountError;

  /// No description provided for @transactionFormCategoryLabel.
  ///
  /// In en, this message translates to:
  /// **'Category'**
  String get transactionFormCategoryLabel;

  /// No description provided for @transactionFormTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get transactionFormTypeLabel;

  /// No description provided for @transactionFormDateLabel.
  ///
  /// In en, this message translates to:
  /// **'Date'**
  String get transactionFormDateLabel;

  /// No description provided for @transactionFormNoteLabel.
  ///
  /// In en, this message translates to:
  /// **'Notes'**
  String get transactionFormNoteLabel;

  /// No description provided for @transactionFormMerchantLabel.
  ///
  /// In en, this message translates to:
  /// **'Merchant'**
  String get transactionFormMerchantLabel;

  /// No description provided for @transactionFormSave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get transactionFormSave;

  /// No description provided for @transactionFormUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update'**
  String get transactionFormUpdate;

  /// No description provided for @transactionFormDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get transactionFormDelete;

  /// No description provided for @transactionDeleteConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete transaction'**
  String get transactionDeleteConfirmTitle;

  /// No description provided for @transactionDeleteConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'Are you sure you want to remove this transaction? This action cannot be undone.'**
  String get transactionDeleteConfirmMessage;

  /// No description provided for @transactionDeleteConfirmConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get transactionDeleteConfirmConfirm;

  /// No description provided for @transactionDeleteConfirmCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get transactionDeleteConfirmCancel;

  /// No description provided for @transactionsNoCategoriesHelper.
  ///
  /// In en, this message translates to:
  /// **'Create a category first to classify this transaction.'**
  String get transactionsNoCategoriesHelper;

  /// No description provided for @transactionsAiProcessing.
  ///
  /// In en, this message translates to:
  /// **'Processing invoice…'**
  String get transactionsAiProcessing;

  /// No description provided for @transactionsAiResultTitle.
  ///
  /// In en, this message translates to:
  /// **'AI suggestions'**
  String get transactionsAiResultTitle;

  /// No description provided for @transactionsAiNoResults.
  ///
  /// In en, this message translates to:
  /// **'No items detected in the invoice. Try again with a clearer photo.'**
  String get transactionsAiNoResults;

  /// No description provided for @transactionsAiResultApply.
  ///
  /// In en, this message translates to:
  /// **'Use suggestion'**
  String get transactionsAiResultApply;

  /// No description provided for @budgetTitle.
  ///
  /// In en, this message translates to:
  /// **'Budget Envelopes'**
  String get budgetTitle;

  /// No description provided for @budgetSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Allocate every shekel and track remaining amounts in each category.'**
  String get budgetSubtitle;

  /// No description provided for @budgetPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Budget envelopes coming soon.'**
  String get budgetPlaceholder;

  /// No description provided for @budgetIncomeHeading.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get budgetIncomeHeading;

  /// No description provided for @budgetNeedsHeading.
  ///
  /// In en, this message translates to:
  /// **'Needs'**
  String get budgetNeedsHeading;

  /// No description provided for @budgetWantsHeading.
  ///
  /// In en, this message translates to:
  /// **'Wants'**
  String get budgetWantsHeading;

  /// No description provided for @budgetLoansHeading.
  ///
  /// In en, this message translates to:
  /// **'Loans'**
  String get budgetLoansHeading;

  /// No description provided for @budgetTotalsIncomeReceived.
  ///
  /// In en, this message translates to:
  /// **'Income received'**
  String get budgetTotalsIncomeReceived;

  /// No description provided for @budgetTotalsBudgeted.
  ///
  /// In en, this message translates to:
  /// **'Budgeted'**
  String get budgetTotalsBudgeted;

  /// No description provided for @budgetTotalsSpent.
  ///
  /// In en, this message translates to:
  /// **'Spent'**
  String get budgetTotalsSpent;

  /// No description provided for @budgetTotalsAvailable.
  ///
  /// In en, this message translates to:
  /// **'Available to budget'**
  String get budgetTotalsAvailable;

  /// No description provided for @budgetAddCategory.
  ///
  /// In en, this message translates to:
  /// **'Add category'**
  String get budgetAddCategory;

  /// No description provided for @budgetEditCategory.
  ///
  /// In en, this message translates to:
  /// **'Edit category'**
  String get budgetEditCategory;

  /// No description provided for @budgetNoCategoriesTitle.
  ///
  /// In en, this message translates to:
  /// **'No budget envelopes yet'**
  String get budgetNoCategoriesTitle;

  /// No description provided for @budgetNoCategoriesSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Create your first category to start allocating every shekel with Zero-Based Budgeting.'**
  String get budgetNoCategoriesSubtitle;

  /// No description provided for @budgetCategoryNameLabel.
  ///
  /// In en, this message translates to:
  /// **'Category name'**
  String get budgetCategoryNameLabel;

  /// No description provided for @budgetCategoryTargetLabel.
  ///
  /// In en, this message translates to:
  /// **'Target amount'**
  String get budgetCategoryTargetLabel;

  /// No description provided for @budgetCategoryTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'Type'**
  String get budgetCategoryTypeLabel;

  /// No description provided for @budgetCategoryTypeNeed.
  ///
  /// In en, this message translates to:
  /// **'Need'**
  String get budgetCategoryTypeNeed;

  /// No description provided for @budgetCategoryTypeWant.
  ///
  /// In en, this message translates to:
  /// **'Want'**
  String get budgetCategoryTypeWant;

  /// No description provided for @budgetCategoryTypeLoan.
  ///
  /// In en, this message translates to:
  /// **'Loan'**
  String get budgetCategoryTypeLoan;

  /// No description provided for @budgetCategoryTypeIncome.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get budgetCategoryTypeIncome;

  /// No description provided for @budgetCategorySave.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get budgetCategorySave;

  /// No description provided for @budgetCategoryUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update'**
  String get budgetCategoryUpdate;

  /// No description provided for @budgetCategoryDelete.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get budgetCategoryDelete;

  /// No description provided for @budgetCategoryDeleteConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Delete category'**
  String get budgetCategoryDeleteConfirmTitle;

  /// No description provided for @budgetCategoryDeleteConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'Deleting this category will remove its budget target. Existing transactions remain untouched.'**
  String get budgetCategoryDeleteConfirmMessage;

  /// No description provided for @budgetCategoryDeleteConfirmCancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get budgetCategoryDeleteConfirmCancel;

  /// No description provided for @budgetCategoryDeleteConfirmConfirm.
  ///
  /// In en, this message translates to:
  /// **'Delete'**
  String get budgetCategoryDeleteConfirmConfirm;

  /// No description provided for @budgetCategoryAmountError.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid amount greater than zero'**
  String get budgetCategoryAmountError;

  /// No description provided for @assistantTitle.
  ///
  /// In en, this message translates to:
  /// **'BudgetPal Assistant'**
  String get assistantTitle;

  /// No description provided for @assistantSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Ask for help with budgets, transactions, and app settings.'**
  String get assistantSubtitle;

  /// No description provided for @assistantPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'What would you like to know about BudgetPal?'**
  String get assistantPlaceholder;

  /// No description provided for @assistantSuggestedHeading.
  ///
  /// In en, this message translates to:
  /// **'Try asking about:'**
  String get assistantSuggestedHeading;

  /// No description provided for @assistantSuggestedTransactions.
  ///
  /// In en, this message translates to:
  /// **'How do I add a new transaction?'**
  String get assistantSuggestedTransactions;

  /// No description provided for @assistantSuggestedBudget.
  ///
  /// In en, this message translates to:
  /// **'What do the budget sections mean?'**
  String get assistantSuggestedBudget;

  /// No description provided for @assistantSuggestedInvoice.
  ///
  /// In en, this message translates to:
  /// **'How does AI invoice import work?'**
  String get assistantSuggestedInvoice;

  /// No description provided for @assistantThinking.
  ///
  /// In en, this message translates to:
  /// **'Thinking…'**
  String get assistantThinking;

  /// No description provided for @assistantProviderMissing.
  ///
  /// In en, this message translates to:
  /// **'Connect BudgetPal to an AI provider to unlock smarter answers.'**
  String get assistantProviderMissing;

  /// No description provided for @assistantApiError.
  ///
  /// In en, this message translates to:
  /// **'I ran into a problem reaching our AI service.'**
  String get assistantApiError;

  /// No description provided for @assistantFallbackIntro.
  ///
  /// In en, this message translates to:
  /// **'Here\'s a quick BudgetPal tip meanwhile:'**
  String get assistantFallbackIntro;

  /// No description provided for @assistantClearChat.
  ///
  /// In en, this message translates to:
  /// **'Clear chat'**
  String get assistantClearChat;

  /// No description provided for @assistantInputHint.
  ///
  /// In en, this message translates to:
  /// **'Type your question about BudgetPal'**
  String get assistantInputHint;

  /// No description provided for @assistantCannotAnswer.
  ///
  /// In en, this message translates to:
  /// **'I can help with BudgetPal features. Try asking about budgets, transactions, or settings.'**
  String get assistantCannotAnswer;

  /// No description provided for @assistantSendButton.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get assistantSendButton;

  /// No description provided for @profileTitle.
  ///
  /// In en, this message translates to:
  /// **'Profile & Settings'**
  String get profileTitle;

  /// No description provided for @profileSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Manage your account details, balances, and preferences.'**
  String get profileSubtitle;

  /// No description provided for @profilePlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Profile settings coming soon.'**
  String get profilePlaceholder;

  /// No description provided for @profileFinancialSectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Balances'**
  String get profileFinancialSectionTitle;

  /// No description provided for @profileFinancialSectionDescription.
  ///
  /// In en, this message translates to:
  /// **'Update your current bank balance and available overdraft.'**
  String get profileFinancialSectionDescription;

  /// No description provided for @profileBankBalanceLabel.
  ///
  /// In en, this message translates to:
  /// **'Bank balance'**
  String get profileBankBalanceLabel;

  /// No description provided for @profileBankBalanceInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid balance.'**
  String get profileBankBalanceInvalid;

  /// No description provided for @profileOverdraftLabel.
  ///
  /// In en, this message translates to:
  /// **'Overdraft limit'**
  String get profileOverdraftLabel;

  /// No description provided for @profileOverdraftInvalid.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid overdraft of zero or more.'**
  String get profileOverdraftInvalid;

  /// No description provided for @profileOverdraftHelper.
  ///
  /// In en, this message translates to:
  /// **'Enter the maximum overdraft you can access. Leave 0 if it does not apply.'**
  String get profileOverdraftHelper;

  /// No description provided for @profileFormSave.
  ///
  /// In en, this message translates to:
  /// **'Save changes'**
  String get profileFormSave;

  /// No description provided for @profileFormReset.
  ///
  /// In en, this message translates to:
  /// **'Revert'**
  String get profileFormReset;

  /// No description provided for @profileUpdateSuccess.
  ///
  /// In en, this message translates to:
  /// **'Profile updated successfully.'**
  String get profileUpdateSuccess;

  /// No description provided for @profileUpdateError.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t update your profile. Try again shortly.'**
  String get profileUpdateError;

  /// No description provided for @profilePreferencesSectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Preferences'**
  String get profilePreferencesSectionTitle;

  /// No description provided for @profileThemeOptionLight.
  ///
  /// In en, this message translates to:
  /// **'Light'**
  String get profileThemeOptionLight;

  /// No description provided for @profileThemeOptionDark.
  ///
  /// In en, this message translates to:
  /// **'Dark'**
  String get profileThemeOptionDark;

  /// No description provided for @profileThemeOptionSystem.
  ///
  /// In en, this message translates to:
  /// **'System'**
  String get profileThemeOptionSystem;

  /// No description provided for @profileLocaleLabel.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get profileLocaleLabel;

  /// No description provided for @profileAccountSectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get profileAccountSectionTitle;

  /// No description provided for @profileAccountEmailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get profileAccountEmailLabel;

  /// No description provided for @profileResetPasswordButton.
  ///
  /// In en, this message translates to:
  /// **'Send password reset'**
  String get profileResetPasswordButton;

  /// No description provided for @profilePasswordResetSent.
  ///
  /// In en, this message translates to:
  /// **'Password reset email sent.'**
  String get profilePasswordResetSent;

  /// No description provided for @profilePasswordResetError.
  ///
  /// In en, this message translates to:
  /// **'We couldn\'t send the reset email. Try again later.'**
  String get profilePasswordResetError;

  /// No description provided for @profileSignOutConfirmTitle.
  ///
  /// In en, this message translates to:
  /// **'Sign out?'**
  String get profileSignOutConfirmTitle;

  /// No description provided for @profileSignOutConfirmMessage.
  ///
  /// In en, this message translates to:
  /// **'You\'ll return to the sign-in screen. Unsaved changes will be lost.'**
  String get profileSignOutConfirmMessage;

  /// No description provided for @profileSignOutConfirmConfirm.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get profileSignOutConfirmConfirm;

  /// No description provided for @profileSignOutConfirmCancel.
  ///
  /// In en, this message translates to:
  /// **'Stay'**
  String get profileSignOutConfirmCancel;

  /// No description provided for @authErrorInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'The email or password you entered is incorrect.'**
  String get authErrorInvalidCredentials;

  /// No description provided for @authErrorUserDisabled.
  ///
  /// In en, this message translates to:
  /// **'This account has been disabled. Contact support if this is unexpected.'**
  String get authErrorUserDisabled;

  /// No description provided for @authErrorUserNotFound.
  ///
  /// In en, this message translates to:
  /// **'No account exists for that email address.'**
  String get authErrorUserNotFound;

  /// No description provided for @authErrorTooManyRequests.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please try again later.'**
  String get authErrorTooManyRequests;

  /// No description provided for @authErrorEmailAlreadyInUse.
  ///
  /// In en, this message translates to:
  /// **'An account already exists with this email address.'**
  String get authErrorEmailAlreadyInUse;

  /// No description provided for @authErrorWeakPassword.
  ///
  /// In en, this message translates to:
  /// **'Choose a stronger password to protect your account.'**
  String get authErrorWeakPassword;

  /// No description provided for @authErrorUsernameTaken.
  ///
  /// In en, this message translates to:
  /// **'That username is already taken.'**
  String get authErrorUsernameTaken;

  /// No description provided for @authErrorUnknown.
  ///
  /// In en, this message translates to:
  /// **'Unable to complete the request. Try again in a moment.'**
  String get authErrorUnknown;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en', 'he'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
    case 'he':
      return AppLocalizationsHe();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
