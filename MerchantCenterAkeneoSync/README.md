<p align="center">
  <a href="https://commercetools.com/">
    <img alt="commercetools logo" src="https://unpkg.com/@commercetools-frontend/assets/logos/commercetools_primary-logo_horizontal_RGB.png">
  </a>
  <b>Custom Application starter template in TypeScript</b>
</p>

This is the [TypeScript](https://www.typescriptlang.org/) version of the starter template to [develop Custom Applications](https://docs.commercetools.com/merchant-center-customizations/custom-applications) for the Merchant Center.

# Installing the template

Read the [Getting started](https://docs.commercetools.com/merchant-center-customizations/custom-applications) documentation for more information.

# Developing the Custom Application

Learn more about [developing a Custom Application](https://docs.commercetools.com/merchant-center-customizations/development) and [how to use the CLI](https://docs.commercetools.com/merchant-center-customizations/api-reference/cli).

# Merchant Center Akeneo Sync

This project is a custom application for the Commercetools Merchant Center that synchronizes data with Akeneo.

## Development

### Prerequisites

- Node.js 16 or higher
- Yarn

### Installation

```bash
yarn install
```

### Run the application locally

```bash
yarn start
```

For production build:

```bash
yarn build
```

## Testing

### Running tests

To run all tests:

```bash
yarn test
```

To run tests in watch mode (useful during development):

```bash
yarn test:watch
```

### Test coverage

The project aims to maintain at least 75% test coverage. To check the current test coverage:

```bash
yarn test
```

This will run the tests and generate a coverage report in the `./coverage` directory.

### Test Coverage Roadmap

The current test coverage is around 19%. To reach the 75% target, the following components need tests:

#### High Priority (Core Business Logic)
1. **Sync Components** (`src/components/sync/`)
   - `sync.tsx`
   - `sync-card.tsx` 
   - `sync-stats.tsx`
   - `settings.tsx`
   - `error-list.tsx`

2. **Custom Hooks** (`src/hooks/use-custom-object/`)
   - `use-custom-object.ts`

#### Medium Priority (Configuration)
3. **Config Editor** (`src/components/config-editor/`)
   - `config-editor.tsx`
   - `config-editor-container.tsx`
   - `collapsed-view.tsx`

4. **Types** (`src/types/`)
   - `status.ts`
   - Additional type definitions

#### Low Priority
5. **Generated Types** (`src/types/generated/`)
   - These are usually auto-generated and may not need extensive testing

### Testing Strategy to Reach 75% Coverage

1. Start with critical business logic components
2. Focus on testing the hooks that manage state and API calls
3. Mock API responses for testing component behavior in different states
4. Test error handling paths
5. Add tests for edge cases and validations

### Adding new tests

Tests are written using Jest and React Testing Library.

- Test files should be placed next to the files they test and have a `.spec.ts` or `.spec.tsx` extension
- For React components, use React Testing Library to render and interact with components
- Use mocks for external dependencies and services
- For API services, mock the fetch calls

### Testing standards

- Use descriptive test names that explain what is being tested
- Follow the Arrange-Act-Assert pattern
- Mock external dependencies
- Test edge cases and error handling
- Keep tests focused and simple

## Folder Structure

- `/src` - Main source code
  - `/components` - React components
  - `/hooks` - Custom React hooks
  - `/services` - API and other services
  - `/test-utils` - Testing utilities
  - `/types` - TypeScript type definitions
