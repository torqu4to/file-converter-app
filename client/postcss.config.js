import postcssNesting from 'postcss-nesting';
import tailwindcss from '@tailwindcss/postcss';

export default {
  plugins: {
    'postcss-nesting': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  }
} 