# Module design

`backend/app/modules` isolates domain and ML-adjacent work from HTTP routes. `ml/` is reserved for offline, reproducible data preparation, experiments, and training. These are scaffolding boundaries, not implemented models.
