import 'package:flutter/material.dart';

import 'app_progress_indicator.dart';

class AppLoader extends StatelessWidget {
  const AppLoader({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: AppProgressIndicator(),
    );
  }
}
