import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:budgetpal/l10n/app_localizations.dart';

import '../../../core/telemetry/analytics_service.dart';
import '../../auth/application/auth_controller.dart';
import '../../budget/presentation/budget_screen.dart';
import '../../assistant/presentation/assistant_screen.dart';
import '../application/dashboard_index_provider.dart';
import '../../home/presentation/home_screen.dart';
import '../../profile/presentation/profile_screen.dart';
import '../../transactions/presentation/transactions_screen.dart';

class DashboardShell extends ConsumerStatefulWidget {
  const DashboardShell({super.key});

  @override
  ConsumerState<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends ConsumerState<DashboardShell> {
  static const List<String> _screenNames = <String>[
    'home_screen',
    'transactions_screen',
    'budget_screen',
    'assistant_screen',
    'profile_screen',
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final index = ref.read(dashboardIndexProvider);
      _logScreen(index);
    });
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final currentIndex = ref.watch(dashboardIndexProvider);
    final authOperation = ref.watch(authControllerProvider);
    final isAuthBusy = authOperation.isLoading;

    final destinations = _destinations(l10n);

    final body = IndexedStack(
      index: currentIndex,
      children: destinations.map((destination) => destination.child).toList(),
    );

    return Scaffold(
      appBar: _DashboardAppBar(
        l10n: l10n,
        onSignOut: () => _confirmSignOut(l10n),
        isBusy: isAuthBusy,
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth >= 900) {
            final isRtl =
                Directionality.of(context) == TextDirection.rtl;
            final rail = _DashboardRail(
              currentIndex: currentIndex,
              onDestinationSelected: (index) => _onDestinationSelected(index),
              destinations: destinations,
            );
            final content = Expanded(child: body);
            const divider = VerticalDivider(width: 1);
            if (isRtl) {
              return Row(
                children: [
                  content,
                  divider,
                  rail,
                ],
              );
            }
            return Row(
              children: [
                rail,
                divider,
                content,
              ],
            );
          }
          return body;
        },
      ),
      bottomNavigationBar: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth >= 900) {
            return const SizedBox.shrink();
          }
          return NavigationBar(
            selectedIndex: currentIndex,
            onDestinationSelected: _onDestinationSelected,
            destinations: destinations
                .map(
                  (destination) => NavigationDestination(
                    icon: Icon(destination.icon),
                    label: destination.label,
                  ),
                )
                .toList(),
          );
        },
      ),
    );
}

  void _onDestinationSelected(int index) {
    ref.read(dashboardIndexProvider.notifier).state = index;
    _logScreen(index);
  }

  void _logScreen(int index) {
    if (index < 0 || index >= _screenNames.length) {
      return;
    }
    final telemetry = ref.read(analyticsServiceProvider);
    telemetry.logScreenView(screenName: _screenNames[index]);
  }

  Future<void> _confirmSignOut(AppLocalizations l10n) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(l10n.profileSignOutConfirmTitle),
          content: Text(l10n.profileSignOutConfirmMessage),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: Text(l10n.profileSignOutConfirmCancel),
            ),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: Text(l10n.profileSignOutConfirmConfirm),
            ),
          ],
        );
      },
    );
    if (confirmed == true) {
      await ref.read(authControllerProvider.notifier).signOut();
    }
  }
}

class _DashboardAppBar extends StatelessWidget implements PreferredSizeWidget {
  const _DashboardAppBar({
    required this.l10n,
    required this.onSignOut,
    required this.isBusy,
  });

  final AppLocalizations l10n;
  final Future<void> Function() onSignOut;
  final bool isBusy;

  @override
  Widget build(BuildContext context) {
    return AppBar(
      title: Text(l10n.appTitle),
      actions: [
        TextButton.icon(
          onPressed: isBusy ? null : () => onSignOut(),
          icon: const Icon(Icons.logout),
          label: Text(l10n.logoutButton),
        ),
        const SizedBox(width: 8),
      ],
      bottom: isBusy
          ? PreferredSize(
              preferredSize: const Size.fromHeight(3),
              child: const LinearProgressIndicator(minHeight: 3),
            )
          : null,
    );
  }

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _DashboardRail extends StatelessWidget {
  const _DashboardRail({
    required this.currentIndex,
    required this.onDestinationSelected,
    required this.destinations,
  });

  final int currentIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<_DashboardDestination> destinations;

  @override
  Widget build(BuildContext context) {
    return NavigationRail(
      selectedIndex: currentIndex,
      onDestinationSelected: onDestinationSelected,
      labelType: NavigationRailLabelType.all,
      destinations: destinations
          .map(
            (destination) => NavigationRailDestination(
              icon: Icon(destination.icon),
              label: Text(destination.label),
            ),
          )
          .toList(),
    );
  }
}

class _DashboardDestination {
  const _DashboardDestination({
    required this.label,
    required this.icon,
    required this.child,
  });

  final String label;
  final IconData icon;
  final Widget child;
}

List<_DashboardDestination> _destinations(AppLocalizations l10n) {
  return [
    _DashboardDestination(
      label: l10n.navHome,
      icon: Icons.home_outlined,
      child: const HomeScreen(),
    ),
    _DashboardDestination(
      label: l10n.navTransactions,
      icon: Icons.list_alt_outlined,
      child: const TransactionsScreen(),
    ),
    _DashboardDestination(
      label: l10n.navBudget,
      icon: Icons.pie_chart_outline,
      child: const BudgetScreen(),
    ),
    _DashboardDestination(
      label: l10n.navAssistant,
      icon: Icons.support_agent_outlined,
      child: const AssistantScreen(),
    ),
    _DashboardDestination(
      label: l10n.navProfile,
      icon: Icons.person_outline,
      child: const ProfileScreen(),
    ),
  ];
}
