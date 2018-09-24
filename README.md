# TERRDL Generator

Application shells built with Typescript, Express, React, Redux, Docker, and Less

## How to:

### Install the generator

1. Install yeoman: `npm install --global yo`
1. Install TERRDL: `npm install --global generator-terrdl`

### Scaffold a new App

1. Create a new folder for your app
1. From within that folder run `yo terrdl`
1. Wait for yeoman to finish
1. Build the new app: `npm run build`
1. And start it! `npm start`

### Add a new entity

1. Run: `yo terrdl:entity {entity-name}`
  * The entity name can be in a variety of cases, but cannot contain spaces
  * Pluralization is automatically handled by the generator
1. Use option `a` to accept all change
1. Implement services and add new actions as needed
