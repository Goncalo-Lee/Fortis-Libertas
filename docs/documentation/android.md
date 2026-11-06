# Android App

How the Android app (`android/`) is organised and the rules to follow when adding code.
For the API it talks to, see [api.md](api.md). For the screens and their design versions, see
[planning/ui](../planning/ui/README.md).

## Stack

| Layer | Technology |
| :--- | :--- |
| Language | Kotlin |
| UI | Jetpack Compose + Material 3 |
| Navigation | Navigation Compose (type-safe routes with `@Serializable`) |
| Network | Retrofit + OkHttp + kotlinx.serialization |
| Images | Coil 3 |
| Blur effects | Haze |
| Min / target SDK | 28 / 35 |

## Folders

```
android/app/src/main/java/pt/fortislibertas/
├── MainActivity.kt          Entry point: sets the theme and calls FortisApp
├── FortisApplication.kt     Creates the AppContainer once for the whole app
├── FortisApp.kt             Scaffold + bottom bar + NavHost
├── core/designsystem/       Everything visual that is NOT tied to one screen
│   ├── components/          Reusable composables (cards, dialogs, form fields, charts/)
│   ├── theme/               Colors, typography, FortisLibertasTheme
│   └── util/                Formatters and parsers (money, dates)
├── data/                    Everything about getting and saving data
│   ├── model/               App models used by the UI (no JSON annotations)
│   ├── remote/              Retrofit APIs (*Api.kt) and AuthInterceptor
│   │   └── dto/             JSON shapes from the API + toModel() mappers
│   ├── local/               Data stored on the phone (AccountStore)
│   ├── fake/                Fake data for previews and USE_FAKE_DATA mode
│   └── repository/          One interface + Fake and Remote implementations
├── di/                      AppContainer: the ONLY place that picks Fake or Remote
└── ui/                      One folder per screen (feature)
    ├── navigation/          Routes and the bottom bar destinations
    └── <feature>/           <Feature>Screen, <Feature>Content, <Feature>ViewModel, <Feature>UiState
        └── components/      Pieces used only by this feature (sections, dialogs, forms)
```

Split a screen file when it mixes several parts (header, cards, dialogs...) or passes ~250 lines.
The pieces go to `ui/<feature>/components/`, one composable per file.

Rule of thumb: **data flows in one direction**.

```
Api / Fake data → Repository → ViewModel → UiState → Screen
```

- A `Screen` never calls a repository directly; it only reads the `UiState` and calls ViewModel functions.
- A `ViewModel` never imports anything from `ui/` or `core/designsystem/components/`.
- Only `di/AppContainer` decides between `Fake*Repository` and `Remote*Repository`
  (`BuildConfig.USE_FAKE_DATA` in `app/build.gradle.kts`).

## Naming

| Kind | Pattern | Example |
| :--- | :--- | :--- |
| Screen (entry composable) | `<Feature>Screen` | `HomeScreen` |
| Screen content (stateless, previewable) | `<Feature>Content` | `HomeContent` |
| ViewModel | `<Feature>ViewModel` | `HomeViewModel` |
| UI state | `<Feature>UiState` | `HomeUiState` |
| Repository | `<Name>Repository` (interface) | `HomeRepository` |
| Repository implementations | `Fake<Name>Repository`, `Remote<Name>Repository` | `FakeHomeRepository` |
| Retrofit interface | `<Name>Api` | `HomeApi` |
| DTO file | `<Name>Dtos.kt` (plural, one file per API) | `HomeDtos.kt` |
| Fake data | `Fake<Name>Data` | `FakeHomeData` |
| Feature component (in `ui/<feature>/components/`) | `<Feature><Name>`, always with the feature prefix | `ProfileHeader`, `ProfileDialogs` |
| Reusable component | `Fortis<Name>` when it wraps a Material component, otherwise a plain name | `FortisTopBar`, `CardStack` |
| String resources file | `strings_<feature>.xml` | `strings_home.xml` |

## Comments

Comments are written in **English**.

- Every file starts with a one-line KDoc on its main class or composable saying **what it is for**.
- Explain **why**, not **what**: `// Pushed off-screen so only part of the cards shows`, not `// offset 56 dp`.
- Every public composable has a one-line KDoc. Parameters only get a comment when the name is not enough.
- `TODO:` comments must say what is missing: `// TODO: connect to the notifications screen`.

## Previews

- Every screen has a preview of its `<Feature>Content` (the stateless part), never of `<Feature>Screen`
  (it needs a ViewModel).
- Every reusable component in `core/designsystem/components/` has at least one preview.
- Use `@FortisPreviews` to get light and dark themes in one annotation.
- Preview data comes from `data/fake/`, never from inline values repeated in many files.
- Preview functions are `private` and named `<Thing>Preview`.

## Adding a new screen

1. Create `ui/<feature>/` with `<Feature>Screen.kt`, `<Feature>ViewModel.kt` and `<Feature>UiState.kt`.
2. Add a route in `ui/navigation/Destinations.kt` and a `composable<...>` in `FortisApp.kt`.
3. If it needs data: add the repository interface, a `Fake` and a `Remote` version, and wire them in `AppContainer`.
4. Add strings to `values/strings_<feature>.xml` **and** `values-pt/strings_<feature>.xml`.
5. Add a preview of `<Feature>Content`.
