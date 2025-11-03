// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appTitle => 'BudgetPal';

  @override
  String get authWelcome => 'مرحبًا بعودتك';

  @override
  String get authRegisterTitle => 'أنشئ حسابك';

  @override
  String get emailLabel => 'البريد الإلكتروني';

  @override
  String get passwordLabel => 'كلمة المرور';

  @override
  String get confirmPasswordLabel => 'تأكيد كلمة المرور';

  @override
  String get signInButton => 'تسجيل الدخول';

  @override
  String get signUpButton => 'إنشاء حساب';

  @override
  String get toggleToRegister => 'لا تملك حسابًا؟ أنشئ حسابًا';

  @override
  String get toggleToLogin => 'لديك حساب بالفعل؟ سجّل الدخول';

  @override
  String get rememberMeLabel => 'تذكرني على هذا الجهاز';

  @override
  String get forgotPasswordLink => 'هل نسيت كلمة المرور؟';

  @override
  String get passwordResetTitle => 'إعادة تعيين كلمة المرور';

  @override
  String get passwordResetDescription =>
      'أدخل بريدك الإلكتروني للحصول على رابط إعادة تعيين كلمة المرور.';

  @override
  String get passwordResetSendButton => 'إرسال رابط إعادة التعيين';

  @override
  String get passwordResetSuccess =>
      'تم إرسال رسالة إعادة التعيين. تفقد صندوق الوارد لديك.';

  @override
  String get retryButtonLabel => 'أعد المحاولة';

  @override
  String get logoutButton => 'تسجيل الخروج';

  @override
  String get loadingLabel => 'جار التحميل...';

  @override
  String get themeToggleLabel => 'السمة';

  @override
  String get languageSelectorLabel => 'اللغة';

  @override
  String get invalidEmailError => 'أدخل بريدًا إلكترونيًا صالحًا';

  @override
  String get passwordMismatchError => 'كلمتا المرور غير متطابقتين';

  @override
  String get passwordTooShortError =>
      'يجب أن تكون كلمة المرور 6 أحرف على الأقل';

  @override
  String get unknownError => 'حدث خطأ ما';

  @override
  String get genericLoadError => 'تعذّر تحميل هذه البيانات الآن.';

  @override
  String get closeButtonTooltip => 'إغلاق';

  @override
  String get passwordToggleShow => 'إظهار كلمة المرور';

  @override
  String get passwordToggleHide => 'إخفاء كلمة المرور';

  @override
  String get navHome => 'الرئيسية';

  @override
  String get navTransactions => 'المعاملات';

  @override
  String get navBudget => 'الميزانية';

  @override
  String get navAssistant => 'المساعد';

  @override
  String get navProfile => 'الملف الشخصي';

  @override
  String get homeOverviewTitle => 'نظرة عامة على أموالك الشخصية';

  @override
  String get homeOverviewSubtitle =>
      'راقب الميزانيات والإنفاق والأهداف في لمحة واحدة.';

  @override
  String get homePlaceholder => 'عناصر لوحة التحكم قيد الإعداد.';

  @override
  String get transactionsTitle => 'المعاملات';

  @override
  String get transactionsSubtitle =>
      'راجع آخر الأنشطة، أضف المشتريات، وعالج الفواتير.';

  @override
  String get transactionsPlaceholder => 'سيظهر سجل المعاملات هنا قريبًا.';

  @override
  String get transactionsAddButton => 'إضافة معاملة';

  @override
  String get transactionsImportInvoice => 'معالجة الفاتورة (ذكاء اصطناعي)';

  @override
  String get transactionsImportCamera => 'التقاط صورة للفاتورة';

  @override
  String get transactionsImportGallery => 'الاختيار من المعرض';

  @override
  String get transactionsSearchHint => 'ابحث في الملاحظات أو المتاجر';

  @override
  String get transactionsAiPickError =>
      'تعذّر الوصول إلى الكاميرا أو المعرض. تحقق من الأذونات وحاول مرة أخرى.';

  @override
  String get transactionsFilterReset => 'مسح عوامل التصفية';

  @override
  String get transactionsEmptyTitle => 'لا توجد معاملات بعد';

  @override
  String get transactionsEmptySubtitle =>
      'ابدأ بإضافة مصروفاتك أو إيراداتك الأخيرة للبقاء على اطلاع على التدفقات النقدية.';

  @override
  String get transactionsDateToday => 'اليوم';

  @override
  String get transactionsDateYesterday => 'أمس';

  @override
  String get transactionsDateEarlier => 'سابقًا';

  @override
  String get transactionTypeExpense => 'مصروف';

  @override
  String get transactionTypeIncome => 'دخل';

  @override
  String get transactionFormTitleNew => 'إضافة معاملة';

  @override
  String get transactionFormTitleEdit => 'تعديل معاملة';

  @override
  String get transactionFormAmountLabel => 'المبلغ';

  @override
  String get transactionFormAmountError => 'يرجى إدخال مبلغ صالح أكبر من صفر';

  @override
  String get transactionFormCategoryLabel => 'الفئة';

  @override
  String get transactionFormTypeLabel => 'النوع';

  @override
  String get transactionFormDateLabel => 'التاريخ';

  @override
  String get transactionFormNoteLabel => 'ملاحظات';

  @override
  String get transactionFormMerchantLabel => 'التاجر';

  @override
  String get transactionFormSave => 'حفظ';

  @override
  String get transactionFormUpdate => 'تحديث';

  @override
  String get transactionFormDelete => 'حذف';

  @override
  String get transactionDeleteConfirmTitle => 'حذف المعاملة';

  @override
  String get transactionDeleteConfirmMessage =>
      'هل أنت متأكد من حذف هذه المعاملة؟ لا يمكن التراجع عن هذا الإجراء.';

  @override
  String get transactionDeleteConfirmConfirm => 'حذف';

  @override
  String get transactionDeleteConfirmCancel => 'إلغاء';

  @override
  String get transactionsNoCategoriesHelper =>
      'أنشئ فئة أولاً لتصنيف هذه المعاملة.';

  @override
  String get transactionsAiProcessing => 'جارٍ معالجة الفاتورة…';

  @override
  String get transactionsAiResultTitle => 'اقتراحات الذكاء الاصطناعي';

  @override
  String get transactionsAiNoResults =>
      'لم يتم العثور على عناصر في الفاتورة. جرّب صورة أوضح.';

  @override
  String get transactionsAiResultApply => 'استخدم الاقتراح';

  @override
  String get budgetTitle => 'أظرف الميزانية';

  @override
  String get budgetSubtitle => 'خصص كل شيكل وتابع المبالغ المتبقية في كل فئة.';

  @override
  String get budgetPlaceholder => 'سيتم عرض أظرف الميزانية هنا قريبًا.';

  @override
  String get budgetIncomeHeading => 'الدخل';

  @override
  String get budgetNeedsHeading => 'الاحتياجات';

  @override
  String get budgetWantsHeading => 'الرغبات';

  @override
  String get budgetLoansHeading => 'القروض';

  @override
  String get budgetTotalsIncomeReceived => 'الدخل المستلم';

  @override
  String get budgetTotalsBudgeted => 'المبلغ المخصص';

  @override
  String get budgetTotalsSpent => 'المصروف';

  @override
  String get budgetTotalsAvailable => 'المتبقي للتخصيص';

  @override
  String get budgetAddCategory => 'إضافة فئة';

  @override
  String get budgetEditCategory => 'تعديل فئة';

  @override
  String get budgetNoCategoriesTitle => 'لا توجد أظرف ميزانية بعد';

  @override
  String get budgetNoCategoriesSubtitle =>
      'أنشئ أول فئة لتبدأ بتخصيص كل شيكل وفق منهجية الميزانية الصفرية.';

  @override
  String get budgetCategoryNameLabel => 'اسم الفئة';

  @override
  String get budgetCategoryTargetLabel => 'المبلغ المستهدف';

  @override
  String get budgetCategoryTypeLabel => 'النوع';

  @override
  String get budgetCategoryTypeNeed => 'احتياج';

  @override
  String get budgetCategoryTypeWant => 'رغبة';

  @override
  String get budgetCategoryTypeLoan => 'قرض';

  @override
  String get budgetCategoryTypeIncome => 'دخل';

  @override
  String get budgetCategorySave => 'حفظ';

  @override
  String get budgetCategoryUpdate => 'تحديث';

  @override
  String get budgetCategoryDelete => 'حذف';

  @override
  String get budgetCategoryDeleteConfirmTitle => 'حذف الفئة';

  @override
  String get budgetCategoryDeleteConfirmMessage =>
      'سيؤدي حذف هذه الفئة إلى إزالة هدف الميزانية الخاص بها. المعاملات الحالية ستظل محفوظة.';

  @override
  String get budgetCategoryDeleteConfirmCancel => 'إلغاء';

  @override
  String get budgetCategoryDeleteConfirmConfirm => 'حذف';

  @override
  String get budgetCategoryAmountError => 'يرجى إدخال مبلغ صالح أكبر من صفر';

  @override
  String get assistantTitle => 'مساعد BudgetPal';

  @override
  String get assistantSubtitle =>
      'اطرح أسئلة حول الميزانيات، المعاملات، وإعدادات التطبيق.';

  @override
  String get assistantPlaceholder => 'ما الذي ترغب بمعرفته عن BudgetPal؟';

  @override
  String get assistantSuggestedHeading => 'جرّب الأسئلة التالية:';

  @override
  String get assistantSuggestedTransactions => 'كيف أضيف معاملة جديدة؟';

  @override
  String get assistantSuggestedBudget => 'ماذا تعني أقسام الميزانية؟';

  @override
  String get assistantSuggestedInvoice =>
      'كيف يعمل استيراد الفواتير بالذكاء الاصطناعي؟';

  @override
  String get assistantThinking => 'جارٍ التفكير…';

  @override
  String get assistantProviderMissing =>
      'قم بتوصيل BudgetPal بمزوّد ذكاء اصطناعي لتحصل على إجابات أذكى.';

  @override
  String get assistantApiError =>
      'واجهت مشكلة في الوصول إلى خدمة الذكاء الاصطناعي الخاصة بنا.';

  @override
  String get assistantFallbackIntro =>
      'إليك تلميح BudgetPal سريع في هذه الأثناء:';

  @override
  String get assistantClearChat => 'مسح المحادثة';

  @override
  String get assistantInputHint => 'اكتب سؤالك حول BudgetPal';

  @override
  String get assistantCannotAnswer =>
      'أستطيع المساعدة في مميزات BudgetPal فقط. جرّب سؤالاً عن الميزانيات أو المعاملات أو الإعدادات.';

  @override
  String get assistantSendButton => 'إرسال';

  @override
  String get profileTitle => 'الملف الشخصي والإعدادات';

  @override
  String get profileSubtitle => 'أدر تفاصيل حسابك والأرصدة والتفضيلات.';

  @override
  String get profilePlaceholder => 'إعدادات الملف الشخصي ستتوفر هنا قريبًا.';

  @override
  String get profileFinancialSectionTitle => 'الأرصدة';

  @override
  String get profileFinancialSectionDescription =>
      'حدّث رصيدك المصرفي الحالي وحد السحب على المكشوف المتاح.';

  @override
  String get profileBankBalanceLabel => 'الرصيد البنكي';

  @override
  String get profileBankBalanceInvalid => 'أدخل رصيدًا صالحًا.';

  @override
  String get profileOverdraftLabel => 'حد السحب على المكشوف';

  @override
  String get profileOverdraftInvalid =>
      'أدخل حد سحب على المكشوف صالحًا أكبر من أو يساوي صفرًا.';

  @override
  String get profileOverdraftHelper =>
      'أدخل الحد الأقصى للسحب على المكشوف المتاح. اتركه 0 إذا لم يكن متوفرًا.';

  @override
  String get profileFormSave => 'حفظ التغييرات';

  @override
  String get profileFormReset => 'تراجع';

  @override
  String get profileUpdateSuccess => 'تم تحديث الملف الشخصي بنجاح.';

  @override
  String get profileUpdateError =>
      'تعذّر تحديث الملف الشخصي. حاول مرة أخرى قريبًا.';

  @override
  String get profilePreferencesSectionTitle => 'التفضيلات';

  @override
  String get profileThemeOptionLight => 'فاتح';

  @override
  String get profileThemeOptionDark => 'داكن';

  @override
  String get profileThemeOptionSystem => 'النظام';

  @override
  String get profileLocaleLabel => 'اللغة';

  @override
  String get profileAccountSectionTitle => 'الحساب';

  @override
  String get profileAccountEmailLabel => 'البريد الإلكتروني';

  @override
  String get profileResetPasswordButton => 'إرسال إعادة تعيين كلمة المرور';

  @override
  String get profilePasswordResetSent =>
      'تم إرسال رسالة إعادة تعيين كلمة المرور.';

  @override
  String get profilePasswordResetError =>
      'تعذّر إرسال رسالة إعادة التعيين. حاول لاحقًا.';

  @override
  String get profileSignOutConfirmTitle => 'تسجيل الخروج؟';

  @override
  String get profileSignOutConfirmMessage =>
      'ستعود إلى شاشة تسجيل الدخول، وسيتم فقدان التغييرات غير المحفوظة.';

  @override
  String get profileSignOutConfirmConfirm => 'تسجيل الخروج';

  @override
  String get profileSignOutConfirmCancel => 'البقاء';

  @override
  String get authErrorInvalidCredentials =>
      'البريد الإلكتروني أو كلمة المرور غير صحيحة.';

  @override
  String get authErrorUserDisabled =>
      'تم تعطيل هذا الحساب. تواصل مع الدعم إذا كان ذلك غير متوقع.';

  @override
  String get authErrorUserNotFound =>
      'لا يوجد حساب مرتبط بهذا البريد الإلكتروني.';

  @override
  String get authErrorTooManyRequests =>
      'محاولات كثيرة جدًا. حاول مرة أخرى لاحقًا.';

  @override
  String get authErrorEmailAlreadyInUse =>
      'يوجد حساب مسجل مسبقًا بهذا البريد الإلكتروني.';

  @override
  String get authErrorWeakPassword => 'اختر كلمة مرور أقوى لحماية حسابك.';

  @override
  String get authErrorUnknown => 'تعذّر إكمال الطلب. حاول مجددًا بعد قليل.';
}
