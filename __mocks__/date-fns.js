// date-fnsのモック
const format = jest.fn((date, formatStr) => {
  // 簡単な日付フォーマット関数
  const d = new Date(date);
  if (formatStr === 'M/d') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  if (formatStr === 'yyyy-MM-dd') {
    return d.toISOString().split('T')[0];
  }
  return d.toLocaleDateString();
});

const parseISO = jest.fn(dateString => new Date(dateString));

const isValid = jest.fn(() => true);

const addDays = jest.fn((date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
});

const isBefore = jest.fn(() => false);

const isAfter = jest.fn(() => true);

// CommonJS export
module.exports = {
  format,
  parseISO,
  isValid,
  addDays,
  isBefore,
  isAfter,
};

// ES Module export (for compatibility)
module.exports.format = format;
module.exports.parseISO = parseISO;
module.exports.isValid = isValid;
module.exports.addDays = addDays;
module.exports.isBefore = isBefore;
module.exports.isAfter = isAfter;
module.exports.default = {
  format,
  parseISO,
  isValid,
  addDays,
  isBefore,
  isAfter,
};
