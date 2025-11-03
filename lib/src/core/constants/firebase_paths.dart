const String appArtifactId = 'nasfinpro';

String artifactsDocumentPath() => 'artifacts/$appArtifactId';

String userDocumentPath(String uid) => 'artifacts/$appArtifactId/users/$uid';

String userTransactionsCollectionPath(String uid) =>
    '${userDocumentPath(uid)}/transactions';

String userTransactionDocumentPath(String uid, String transactionId) =>
    '${userTransactionsCollectionPath(uid)}/$transactionId';

String userCategoriesCollectionPath(String uid) =>
    '${userDocumentPath(uid)}/categories';

String userCategoryDocumentPath(String uid, String categoryId) =>
    '${userCategoriesCollectionPath(uid)}/$categoryId';

String usernameDocumentPath(String username) =>
    'artifacts/$appArtifactId/usernames/${username.toLowerCase()}';
