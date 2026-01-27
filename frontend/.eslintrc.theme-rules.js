/**
 * ESLint Custom Rules for AayuCare Production Safety
 * Prevents runtime errors by enforcing proper API usage
 * 
 * CRITICAL: Prevents:
 * 1. "Property 'theme' doesn't exist" errors
 * 2. "insets.bottom is not a function" errors
 */

module.exports = {
  rules: {
    // Custom rule to enforce theme import when using theme properties
    'require-theme-import': {
      create(context) {
        let usesThemeProperties = false;
        let hasThemeImport = false;

        return {
          // Check for import statements
          ImportDeclaration(node) {
            const source = node.source.value;
            if (
              source.includes('/theme') &&
              node.specifiers.some(
                (spec) =>
                  spec.type === 'ImportSpecifier' &&
                  spec.imported.name === 'theme'
              )
            ) {
              hasThemeImport = true;
            }
          },

          // Check for theme property usage
          MemberExpression(node) {
            if (
              node.object.name === 'theme' &&
              node.property.name &&
              ['typography', 'spacing', 'colors', 'shadows', 'elevation'].includes(
                node.property.name
              )
            ) {
              usesThemeProperties = true;
            }
          },

          // Report error at end of file if theme is used but not imported
          'Program:exit'() {
            if (usesThemeProperties && !hasThemeImport) {
              context.report({
                message:
                  'File uses theme properties but does not import theme. Add: import { theme } from "../../theme"',
                loc: { line: 1, column: 0 },
              });
            }
          },
        };
      },
    },

    // Custom rule to prevent calling insets properties as functions
    'no-insets-function-call': {
      create(context) {
        return {
          CallExpression(node) {
            // Check if this is a call on insets object property
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.name === 'insets' &&
              ['top', 'bottom', 'left', 'right'].includes(node.callee.property.name)
            ) {
              context.report({
                node,
                message: `SafeAreaInsets properties are not functions. Use 'insets.${node.callee.property.name}' as a property, not 'insets.${node.callee.property.name}()'`,
              });
            }
          },
        };
      },
    },
  },
};
