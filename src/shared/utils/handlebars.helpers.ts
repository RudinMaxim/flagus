import Handlebars from 'handlebars';

export function registerHandlebarsHelpers(handlebars: typeof Handlebars): void {
  handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  handlebars.registerHelper('neq', function (a, b) {
    return a !== b;
  });

  handlebars.registerHelper('formatDate', function (date) {
    if (!date) return '';

    const dateObj = new Date(date);
    return dateObj.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  });

  handlebars.registerHelper('relativeTime', function (date) {
    if (!date) return '';

    const now = new Date();
    const dateObj = new Date(date);
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHr / 24);

    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    } else if (diffHr < 24) {
      return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
  });

  handlebars.registerHelper('truncate', function (text, length) {
    if (!text) return '';

    if (text.length <= length) {
      return text;
    }

    return text.substring(0, length) + '...';
  });

  handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context);
  });

  handlebars.registerHelper('count', function (value) {
    if (Array.isArray(value)) {
      return value.length;
    } else if (typeof value === 'object' && value !== null) {
      return Object.keys(value).length;
    }
    return 0;
  });

  handlebars.registerHelper('ifClass', function (condition, trueClass, falseClass) {
    return condition ? trueClass : falseClass || '';
  });

  handlebars.registerHelper('eachWithIndex', function (array, options) {
    let result = '';

    for (let i = 0; i < array.length; i++) {
      result += options.fn({
        ...array[i],
        index: i,
        isFirst: i === 0,
        isLast: i === array.length - 1,
      });
    }

    return result;
  });
}
