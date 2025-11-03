// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Hebrew (`he`).
class AppLocalizationsHe extends AppLocalizations {
  AppLocalizationsHe([String locale = 'he']) : super(locale);

  @override
  String get appTitle => 'BudgetPal';

  @override
  String get authWelcome => 'ברוך הבא';

  @override
  String get authRegisterTitle => 'צור חשבון';

  @override
  String get emailLabel => 'אימייל';

  @override
  String get passwordLabel => 'סיסמה';

  @override
  String get confirmPasswordLabel => 'אשר סיסמה';

  @override
  String get signInButton => 'התחבר';

  @override
  String get signUpButton => 'הירשם';

  @override
  String get toggleToRegister => 'אין לך חשבון? הירשם';

  @override
  String get toggleToLogin => 'כבר יש לך חשבון? התחבר';

  @override
  String get rememberMeLabel => 'זכור אותי במכשיר זה';

  @override
  String get forgotPasswordLink => 'שכחת סיסמה?';

  @override
  String get passwordResetTitle => 'איפוס סיסמה';

  @override
  String get passwordResetDescription =>
      'הזן את האימייל כדי לקבל קישור לאיפוס הסיסמה.';

  @override
  String get passwordResetSendButton => 'שלח קישור לאיפוס';

  @override
  String get passwordResetSuccess =>
      'אימייל לאיפוס סיסמה נשלח. בדוק את תיבת הדואר.';

  @override
  String get retryButtonLabel => 'נסו שוב';

  @override
  String get logoutButton => 'התנתק';

  @override
  String get loadingLabel => 'טוען...';

  @override
  String get themeToggleLabel => 'ערכת נושא';

  @override
  String get languageSelectorLabel => 'שפה';

  @override
  String get invalidEmailError => 'נא להזין כתובת אימייל תקינה';

  @override
  String get passwordMismatchError => 'הסיסמאות אינן תואמות';

  @override
  String get passwordTooShortError => 'הסיסמה חייבת לכלול לפחות 6 תווים';

  @override
  String get unknownError => 'אירעה שגיאה';

  @override
  String get genericLoadError => 'לא הצלחנו לטעון את הנתונים כעת.';

  @override
  String get closeButtonTooltip => 'סגירה';

  @override
  String get passwordToggleShow => 'הצג סיסמה';

  @override
  String get passwordToggleHide => 'הסתר סיסמה';

  @override
  String get navHome => 'בית';

  @override
  String get navTransactions => 'תנועות';

  @override
  String get navBudget => 'תקציב';

  @override
  String get navAssistant => 'עוזר';

  @override
  String get navProfile => 'פרופיל';

  @override
  String get homeOverviewTitle => 'סקירת פיננסים אישיים';

  @override
  String get homeOverviewSubtitle =>
      'עקבו אחר התקציבים, ההוצאות והיעדים במבט אחד.';

  @override
  String get homePlaceholder => 'ווידג\'טים של לוח המחוונים בדרך.';

  @override
  String get transactionsTitle => 'תנועות';

  @override
  String get transactionsSubtitle =>
      'בדקו פעילות אחרונה, הוסיפו רכישות ועבדו חשבוניות.';

  @override
  String get transactionsPlaceholder => 'רשימת התנועות תוצג כאן בקרוב.';

  @override
  String get transactionsAddButton => 'הוספת תנועה';

  @override
  String get transactionsImportInvoice => 'עיבוד חשבונית (בינה)';

  @override
  String get transactionsImportCamera => 'צלם חשבונית';

  @override
  String get transactionsImportGallery => 'בחר מהגלריה';

  @override
  String get transactionsSearchHint => 'חיפוש הערות או בתי עסק';

  @override
  String get transactionsAiPickError =>
      'לא הצלחנו לגשת למצלמה או לגלריה. בדקו הרשאות ונסו שוב.';

  @override
  String get transactionsFilterReset => 'ניקוי סינונים';

  @override
  String get transactionsEmptyTitle => 'אין תנועות עדיין';

  @override
  String get transactionsEmptySubtitle =>
      'התחילו בהוספת הוצאות או הכנסות אחרונות כדי לעקוב אחר התזרים.';

  @override
  String get transactionsDateToday => 'היום';

  @override
  String get transactionsDateYesterday => 'אתמול';

  @override
  String get transactionsDateEarlier => 'קודם';

  @override
  String get transactionTypeExpense => 'הוצאה';

  @override
  String get transactionTypeIncome => 'הכנסה';

  @override
  String get transactionFormTitleNew => 'הוספת תנועה';

  @override
  String get transactionFormTitleEdit => 'עריכת תנועה';

  @override
  String get transactionFormAmountLabel => 'סכום';

  @override
  String get transactionFormAmountError => 'נא להזין סכום תקף גדול מאפס';

  @override
  String get transactionFormCategoryLabel => 'קטגוריה';

  @override
  String get transactionFormTypeLabel => 'סוג';

  @override
  String get transactionFormDateLabel => 'תאריך';

  @override
  String get transactionFormNoteLabel => 'הערות';

  @override
  String get transactionFormMerchantLabel => 'בית עסק';

  @override
  String get transactionFormSave => 'שמירה';

  @override
  String get transactionFormUpdate => 'עדכון';

  @override
  String get transactionFormDelete => 'מחיקה';

  @override
  String get transactionDeleteConfirmTitle => 'מחיקת תנועה';

  @override
  String get transactionDeleteConfirmMessage =>
      'האם למחוק את התנועה? פעולה זו אינה הפיכה.';

  @override
  String get transactionDeleteConfirmConfirm => 'מחק';

  @override
  String get transactionDeleteConfirmCancel => 'ביטול';

  @override
  String get transactionsNoCategoriesHelper =>
      'צרו קטגוריה לפני שתסווגו את התנועה.';

  @override
  String get transactionsAiProcessing => 'החשבונית מעובדת...';

  @override
  String get transactionsAiResultTitle => 'הצעות מהבינה';

  @override
  String get transactionsAiNoResults =>
      'לא נמצאו פריטים בחשבונית. נסו צילום ברור יותר.';

  @override
  String get transactionsAiResultApply => 'השתמש בהצעה';

  @override
  String get budgetTitle => 'מעטפות תקציב';

  @override
  String get budgetSubtitle =>
      'הקצו כל שקל ועקבו אחר הסכומים שנותרו בכל קטגוריה.';

  @override
  String get budgetPlaceholder => 'מעטפות התקציב יופיעו כאן בקרוב.';

  @override
  String get budgetIncomeHeading => 'הכנסות';

  @override
  String get budgetNeedsHeading => 'צרכים';

  @override
  String get budgetWantsHeading => 'רצונות';

  @override
  String get budgetLoansHeading => 'הלוואות';

  @override
  String get budgetTotalsIncomeReceived => 'הכנסות שהתקבלו';

  @override
  String get budgetTotalsBudgeted => 'סך התקציב';

  @override
  String get budgetTotalsSpent => 'הוצאות בפועל';

  @override
  String get budgetTotalsAvailable => 'זמין לתקצוב';

  @override
  String get budgetAddCategory => 'הוספת קטגוריה';

  @override
  String get budgetEditCategory => 'עריכת קטגוריה';

  @override
  String get budgetNoCategoriesTitle => 'אין מעטפות תקציב עדיין';

  @override
  String get budgetNoCategoriesSubtitle =>
      'צרו קטגוריה ראשונה כדי להתחיל לתקצב כל שקל בשיטת האפס.';

  @override
  String get budgetCategoryNameLabel => 'שם הקטגוריה';

  @override
  String get budgetCategoryTargetLabel => 'סכום יעד';

  @override
  String get budgetCategoryTypeLabel => 'סוג';

  @override
  String get budgetCategoryTypeNeed => 'צורך';

  @override
  String get budgetCategoryTypeWant => 'רצון';

  @override
  String get budgetCategoryTypeLoan => 'הלוואה';

  @override
  String get budgetCategoryTypeIncome => 'הכנסה';

  @override
  String get budgetCategorySave => 'שמירה';

  @override
  String get budgetCategoryUpdate => 'עדכון';

  @override
  String get budgetCategoryDelete => 'מחיקה';

  @override
  String get budgetCategoryDeleteConfirmTitle => 'מחיקת קטגוריה';

  @override
  String get budgetCategoryDeleteConfirmMessage =>
      'מחיקת הקטגוריה תסיר את יעד התקציב שלה. התנועות הקיימות אינן נפגעות.';

  @override
  String get budgetCategoryDeleteConfirmCancel => 'ביטול';

  @override
  String get budgetCategoryDeleteConfirmConfirm => 'מחק';

  @override
  String get budgetCategoryAmountError => 'נא להזין סכום תקף גדול מאפס';

  @override
  String get assistantTitle => 'העוזר של BudgetPal';

  @override
  String get assistantSubtitle => 'שאלו על תקציבים, תנועות והגדרות באפליקציה.';

  @override
  String get assistantPlaceholder => 'על מה תרצו לדעת ב-BudgetPal?';

  @override
  String get assistantSuggestedHeading => 'אפשר לשאול למשל:';

  @override
  String get assistantSuggestedTransactions => 'איך מוסיפים תנועה חדשה?';

  @override
  String get assistantSuggestedBudget => 'מה משמעות סעיפי התקציב?';

  @override
  String get assistantSuggestedInvoice =>
      'איך עובד ייבוא החשבוניות באמצעות AI?';

  @override
  String get assistantThinking => 'חושב…';

  @override
  String get assistantProviderMissing =>
      'חברו את BudgetPal לספק בינה מלאכותית כדי לקבל תשובות חכמות יותר.';

  @override
  String get assistantApiError =>
      'נתקלתי בבעיה בהגעה לשירות הבינה המלאכותית שלנו.';

  @override
  String get assistantFallbackIntro => 'בינתיים הנה טיפ מהיר מ-BudgetPal:';

  @override
  String get assistantClearChat => 'נקה צ׳אט';

  @override
  String get assistantInputHint => 'הקלידו שאלה על BudgetPal';

  @override
  String get assistantCannotAnswer =>
      'אני יכול לעזור רק בנושאים שקשורים ל-BudgetPal. נסו לשאול על תקציבים, תנועות או הגדרות.';

  @override
  String get assistantSendButton => 'שלח';

  @override
  String get profileTitle => 'פרופיל והגדרות';

  @override
  String get profileSubtitle => 'נהלו את פרטי החשבון, היתרות והעדפותיכם.';

  @override
  String get profilePlaceholder => 'הגדרות הפרופיל יופיעו כאן בקרוב.';

  @override
  String get profileFinancialSectionTitle => 'יתרות';

  @override
  String get profileFinancialSectionDescription =>
      'עדכנו את יתרת הבנק הנוכחית ואת מסגרת היתר הזמינה.';

  @override
  String get profileBankBalanceLabel => 'יתרת בנק';

  @override
  String get profileBankBalanceInvalid => 'הזינו יתרה חוקית.';

  @override
  String get profileOverdraftLabel => 'מסגרת אשראי';

  @override
  String get profileOverdraftInvalid =>
      'הזינו מסגרת אשראי חוקית הגדולה או שווה לאפס.';

  @override
  String get profileOverdraftHelper =>
      'הזינו את מסגרת האשראי המרבית. השאירו 0 אם לא רלוונטי.';

  @override
  String get profileFormSave => 'שמור שינויים';

  @override
  String get profileFormReset => 'בטל';

  @override
  String get profileUpdateSuccess => 'הפרופיל עודכן בהצלחה.';

  @override
  String get profileUpdateError =>
      'לא הצלחנו לעדכן את הפרופיל. נסו שוב מאוחר יותר.';

  @override
  String get profilePreferencesSectionTitle => 'העדפות';

  @override
  String get profileThemeOptionLight => 'בהיר';

  @override
  String get profileThemeOptionDark => 'כהה';

  @override
  String get profileThemeOptionSystem => 'מערכת';

  @override
  String get profileLocaleLabel => 'שפה';

  @override
  String get profileAccountSectionTitle => 'חשבון';

  @override
  String get profileAccountEmailLabel => 'דוא\"ל';

  @override
  String get profileResetPasswordButton => 'שלח קישור לאיפוס סיסמה';

  @override
  String get profilePasswordResetSent => 'קישור לאיפוס סיסמה נשלח.';

  @override
  String get profilePasswordResetError =>
      'לא ניתן לשלוח את קישור האיפוס. נסו שוב מאוחר יותר.';

  @override
  String get profileSignOutConfirmTitle => 'להתנתק?';

  @override
  String get profileSignOutConfirmMessage =>
      'תחזרו למסך הכניסה. שינויים שלא נשמרו יאבדו.';

  @override
  String get profileSignOutConfirmConfirm => 'התנתק';

  @override
  String get profileSignOutConfirmCancel => 'הישאר';

  @override
  String get authErrorInvalidCredentials => 'האימייל או הסיסמה אינם נכונים.';

  @override
  String get authErrorUserDisabled =>
      'החשבון הזה הושבת. פנו לתמיכה במידה וזה מפתיע.';

  @override
  String get authErrorUserNotFound => 'לא נמצא חשבון עבור כתובת אימייל זו.';

  @override
  String get authErrorTooManyRequests =>
      'בוצעו יותר מדי ניסיונות. נסו שוב מאוחר יותר.';

  @override
  String get authErrorEmailAlreadyInUse => 'כבר קיים חשבון עם כתובת אימייל זו.';

  @override
  String get authErrorWeakPassword => 'בחרו סיסמה חזקה יותר להגנה על החשבון.';

  @override
  String get authErrorUnknown => 'לא ניתן להשלים את הבקשה. נסו שוב בעוד רגע.';
}
