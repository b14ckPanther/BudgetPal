class AssistantMessage {
  const AssistantMessage({
    required this.text,
    required this.fromUser,
    required this.sentAt,
    this.links = const [],
  });

  final String text;
  final bool fromUser;
  final DateTime sentAt;
  final List<AssistantLink> links;

  AssistantMessage copyWith({
    String? text,
    bool? fromUser,
    DateTime? sentAt,
    List<AssistantLink>? links,
  }) {
    return AssistantMessage(
      text: text ?? this.text,
      fromUser: fromUser ?? this.fromUser,
      sentAt: sentAt ?? this.sentAt,
      links: links ?? this.links,
    );
  }
}

class AssistantLink {
  const AssistantLink({required this.label, required this.destination});

  final String label;
  final AssistantDestination destination;
}

enum AssistantDestination { home, transactions, budget, assistant, profile }
