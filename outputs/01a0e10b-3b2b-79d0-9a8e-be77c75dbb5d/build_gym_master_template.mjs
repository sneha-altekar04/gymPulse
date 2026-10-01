import fs from 'node:fs/promises';
import path from 'node:path';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const outputDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:([A-Za-z]:))/, '$1'));
const outputPath = path.join(outputDir, 'GymPulse_Owner_Master_Data_Template.xlsx');
const qaDir = path.join(outputDir, 'qa');

const COLORS = {
  navy: '#17365D',
  blue: '#2F75B5',
  lightBlue: '#D9EAF7',
  amber: '#FFF2CC',
  amberDark: '#C65911',
  green: '#E2F0D9',
  red: '#FCE4D6',
  redText: '#C00000',
  gray: '#E7E6E6',
  lightGray: '#F5F6F8',
  text: '#1F2937',
  white: '#FFFFFF'
};
const FONT = 'Arial';
const DATA_START = 6;

function colName(number) {
  let result = '';
  let n = number;
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

const yesNo = ['YES', 'NO'];
const activeInactive = ['ACTIVE', 'INACTIVE'];
const specifications = [
  {
    name: 'Gym Profile', title: 'Gym profile', instruction: 'Enter one row only. This controls the gym identity and public visitor profile.', rows: 1, table: 'GymProfileTable', tabColor: COLORS.navy,
    columns: [
      ['gymCode', true, 'Text', 'Unique internal code, e.g. K3OXYGEN', 16],
      ['name', true, 'Text', 'Registered or trading gym name', 24],
      ['slug', true, 'lowercase-hyphen', 'Public URL slug, e.g. k3-oxygen', 20],
      ['tagline', false, 'Text', 'Short public tagline', 30],
      ['description', false, 'Long text', 'Public description of the gym', 42],
      ['phone', true, 'Text', 'Public phone; keep as text', 18],
      ['email', false, 'Email', 'Public contact email', 28],
      ['address', true, 'Text', 'Street address', 36],
      ['city', true, 'Text', 'City', 18],
      ['state', true, 'Text', 'State', 18],
      ['pincode', true, 'Text', 'Postal code; keep leading zeroes', 14],
      ['googleMapsUrl', false, 'URL', 'Full Google Maps link', 34],
      ['latitude', false, 'Decimal', 'Optional decimal latitude', 14, { format: '0.000000' }],
      ['longitude', false, 'Decimal', 'Optional decimal longitude', 14, { format: '0.000000' }],
      ['website', false, 'URL', 'Website URL including https://', 30],
      ['instagram', false, 'URL', 'Instagram profile URL', 30],
      ['facebook', false, 'URL', 'Facebook page URL', 30],
      ['ownerName', true, 'Text', 'Owner or primary contact name', 24],
      ['ownerDesignation', false, 'Text', 'Example: Founder & Owner', 22],
      ['ownerIntroduction', false, 'Long text', 'Short owner introduction for public page', 40],
      ['publicProfileEnabled', true, 'YES/NO', 'YES publishes the public profile', 20, { validation: yesNo }]
    ]
  },
  {
    name: 'Opening Hours', title: 'Opening hours', instruction: 'Enter one row for each day. Use real Excel time values for openTime and closeTime.', rows: 7, table: 'OpeningHoursTable',
    columns: [
      ['gymCode', true, 'Text', 'Must match Gym Profile gymCode', 16],
      ['dayOfWeek', true, 'List', 'Day name', 16, { validation: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] }],
      ['isClosed', true, 'YES/NO', 'YES if closed all day', 14, { validation: yesNo }],
      ['openTime', false, 'Time', 'Required when isClosed is NO', 14, { format: 'h:mm AM/PM' }],
      ['closeTime', false, 'Time', 'Required when isClosed is NO', 14, { format: 'h:mm AM/PM' }],
      ['notes', false, 'Text', 'Optional note such as holiday hours', 30]
    ],
    seedRows: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(day => ['', day, 'NO', null, null, ''])
  },
  {
    name: 'Facilities', title: 'Facilities', instruction: 'List each facility or service once.', rows: 30, table: 'FacilitiesTable',
    columns: [
      ['gymCode', true, 'Text', 'Must match Gym Profile gymCode', 16],
      ['facilityCode', true, 'Text', 'Unique code, e.g. STRENGTH', 18],
      ['facilityName', true, 'Text', 'Display name shown publicly', 28],
      ['icon', false, 'Text', 'Optional icon key; leave blank if unsure', 18],
      ['active', true, 'YES/NO', 'Whether this facility is offered', 14, { validation: yesNo }]
    ]
  },
  {
    name: 'Staff Users', title: 'Staff users', instruction: 'Provide access details only. Do not enter passwords. Accounts will be provisioned securely.', rows: 50, table: 'StaffUsersTable',
    columns: [
      ['staffCode', true, 'Text', 'Unique staff code', 16],
      ['name', true, 'Text', 'Full name', 24],
      ['email', true, 'Email', 'Unique login email', 30],
      ['role', true, 'List', 'Access role', 20, { validation: ['OWNER','MANAGER','RECEPTIONIST','TRAINER'] }],
      ['trainerCode', false, 'Text', 'Required only when role is TRAINER', 18],
      ['active', true, 'YES/NO', 'Whether the account should be enabled', 14, { validation: yesNo }]
    ]
  },
  {
    name: 'Membership Plans', title: 'Membership plans', instruction: 'List every membership plan currently offered.', rows: 50, table: 'MembershipPlansTable',
    columns: [
      ['planCode', true, 'Text', 'Unique plan code, e.g. MONTHLY', 16],
      ['name', true, 'Text', 'Plan display name', 24],
      ['duration', true, 'Whole number', 'Duration quantity greater than zero', 14, { format: '0', whole: [1, 3650] }],
      ['durationUnit', true, 'List', 'DAYS, MONTHS, or YEARS', 18, { validation: ['DAYS','MONTHS','YEARS'] }],
      ['price', true, 'Currency INR', 'Current selling price', 16, { format: '₹#,##0' }],
      ['description', false, 'Long text', 'Plan description', 38],
      ['active', true, 'YES/NO', 'Whether the plan can be selected', 14, { validation: yesNo }]
    ]
  },
  {
    name: 'PT Plans', title: 'Personal training plans', instruction: 'List each personal training package and its current price.', rows: 50, table: 'PTPlansTable',
    columns: [
      ['ptPlanCode', true, 'Text', 'Unique PT plan code', 16],
      ['name', true, 'Text', 'PT plan display name', 25],
      ['duration', true, 'Whole number', 'Duration quantity greater than zero', 14, { format: '0', whole: [1, 3650] }],
      ['durationUnit', true, 'List', 'DAYS, MONTHS, or YEARS', 18, { validation: ['DAYS','MONTHS','YEARS'] }],
      ['price', true, 'Currency INR', 'Current selling price', 16, { format: '₹#,##0' }],
      ['description', false, 'Long text', 'PT plan description', 38],
      ['status', true, 'List', 'ACTIVE or INACTIVE', 14, { validation: activeInactive }]
    ]
  },
  {
    name: 'Trainers', title: 'Trainers', instruction: 'List employed or contracted trainers who should appear in GymPulse.', rows: 100, table: 'TrainersTable',
    columns: [
      ['trainerCode', true, 'Text', 'Unique trainer code', 16],
      ['fullName', true, 'Text', 'Trainer full name', 24],
      ['mobile', true, 'Text', '10-digit mobile number; keep as text', 18],
      ['email', false, 'Email', 'Trainer email', 28],
      ['gender', false, 'List', 'Male, Female, or Other', 14, { validation: ['Male','Female','Other'] }],
      ['specialization', true, 'Text', 'Primary training specialization', 32],
      ['joiningDate', true, 'Date', 'Date trainer joined', 16, { format: 'dd-mmm-yyyy' }],
      ['status', true, 'List', 'ACTIVE or INACTIVE', 14, { validation: activeInactive }]
    ]
  },
  {
    name: 'Members', title: 'Members', instruction: 'One row per member. Keep mobile, pincode-like values, member codes, and device IDs as text.', rows: 500, table: 'MembersTable',
    columns: [
      ['memberCode', true, 'Text', 'Unique existing member code', 18],
      ['fullName', true, 'Text', 'Member full name', 24],
      ['mobile', true, 'Text', '10-digit mobile number', 18],
      ['email', true, 'Email', 'Member email', 28],
      ['gender', false, 'List', 'Male, Female, or Other', 14, { validation: ['Male','Female','Other'] }],
      ['dateOfBirth', false, 'Date', 'Date of birth', 16, { format: 'dd-mmm-yyyy' }],
      ['address', false, 'Long text', 'Residential address', 36],
      ['emergencyContactName', false, 'Text', 'Emergency contact name', 26],
      ['emergencyContactNumber', false, 'Text', '10-digit emergency contact number', 22],
      ['joiningDate', true, 'Date', 'Original joining date', 16, { format: 'dd-mmm-yyyy' }],
      ['trainerCode', false, 'Text', 'General assigned trainer code, if any', 18],
      ['deviceUserId', false, 'Text', 'Biometric device user ID', 18],
      ['status', true, 'List', 'ACTIVE or INACTIVE', 14, { validation: activeInactive }]
    ]
  },
  {
    name: 'Current Memberships', title: 'Current memberships', instruction: 'One row per member for the current membership. Dates and financial values should reflect the current contract.', rows: 500, table: 'CurrentMembershipsTable',
    columns: [
      ['memberCode', true, 'Text', 'Must match Members memberCode', 18],
      ['planCode', true, 'Text', 'Must match Membership Plans planCode', 16],
      ['startDate', true, 'Date', 'Current membership start date', 16, { format: 'dd-mmm-yyyy' }],
      ['endDate', true, 'Date', 'Current membership end date', 16, { format: 'dd-mmm-yyyy' }],
      ['originalAmount', true, 'Currency INR', 'Price before discount', 18, { format: '₹#,##0' }],
      ['discount', true, 'Currency INR', 'Discount amount; use 0 if none', 16, { format: '₹#,##0' }],
      ['finalAmount', true, 'Currency INR', 'Amount after discount', 18, { format: '₹#,##0' }],
      ['amountPaid', true, 'Currency INR', 'Amount already collected', 18, { format: '₹#,##0' }],
      ['paymentMode', false, 'List', 'Mode used for amount already paid', 18, { validation: ['CASH','UPI','CARD','BANK_TRANSFER'] }],
      ['status', true, 'List', 'Current membership status', 16, { validation: ['ACTIVE','EXPIRED','CANCELLED','FROZEN'] }],
      ['notes', false, 'Text', 'Migration note or special condition', 32]
    ]
  },
  {
    name: 'Current PT', title: 'Current personal training', instruction: 'Use only for members who currently have or recently had a PT package.', rows: 300, table: 'CurrentPTTable',
    columns: [
      ['memberCode', true, 'Text', 'Must match Members memberCode', 18],
      ['ptPlanCode', true, 'Text', 'Must match PT Plans ptPlanCode', 18],
      ['trainerCode', true, 'Text', 'Must match Trainers trainerCode', 18],
      ['startDate', true, 'Date', 'PT start date', 16, { format: 'dd-mmm-yyyy' }],
      ['endDate', true, 'Date', 'PT end date', 16, { format: 'dd-mmm-yyyy' }],
      ['chargeAmount', true, 'Currency INR', 'PT amount before discount', 18, { format: '₹#,##0' }],
      ['discountAmount', true, 'Currency INR', 'PT discount; use 0 if none', 18, { format: '₹#,##0' }],
      ['amountPaid', true, 'Currency INR', 'PT amount already collected', 18, { format: '₹#,##0' }],
      ['status', true, 'List', 'Current PT status', 16, { validation: ['ACTIVE','EXPIRED','CANCELLED','PAUSED'] }],
      ['notes', false, 'Text', 'Migration note or special condition', 32]
    ]
  },
  {
    name: 'Messaging Settings', title: 'Messaging settings', instruction: 'Enter one row. Leave provider as MOCK until a real provider is connected.', rows: 1, table: 'MessagingSettingsTable',
    columns: [
      ['gymCode', true, 'Text', 'Must match Gym Profile gymCode', 16],
      ['provider', true, 'List', 'Current provider', 14, { validation: ['MOCK'] }],
      ['channel', true, 'List', 'Current channel', 16, { validation: ['WHATSAPP'] }],
      ['enabled', true, 'YES/NO', 'Enable messaging workflows', 14, { validation: yesNo }],
      ['reminderDays', true, 'Comma list', 'Example: 7,3,1', 18],
      ['sendOnExpiry', true, 'YES/NO', 'Send on expiry date', 18, { validation: yesNo }],
      ['paymentReminders', true, 'YES/NO', 'Enable payment reminders', 20, { validation: yesNo }],
      ['defaultSender', false, 'Text', 'Example: K3 Oxygen Front Desk', 28],
      ['batchSize', true, 'Whole number', 'Messages processed per batch', 14, { format: '0', whole: [1, 100] }],
      ['maxRetries', true, 'Whole number', 'Maximum retry attempts', 14, { format: '0', whole: [0, 10] }]
    ],
    seedRows: [['', 'MOCK', 'WHATSAPP', 'YES', '7,3,1', 'NO', 'YES', '', 10, 2]]
  },
  {
    name: 'Message Templates', title: 'Message templates', instruction: 'Use approved wording. Supported variables include {{memberName}}, {{gymName}}, {{membershipPlan}}, {{expiryDate}}, {{daysRemaining}}, {{amountDue}}, and {{gymPhone}}.', rows: 50, table: 'MessageTemplatesTable',
    columns: [
      ['templateCode', true, 'Text', 'Unique template code', 18],
      ['name', true, 'Text', 'Template display name', 28],
      ['channel', true, 'List', 'Current channel', 16, { validation: ['WHATSAPP'] }],
      ['type', true, 'List', 'Message event type', 28, { validation: ['EXPIRY_7_DAYS','EXPIRY_3_DAYS','EXPIRY_1_DAY','MEMBERSHIP_EXPIRED','GENERAL_ANNOUNCEMENT','PAYMENT_REMINDER'] }],
      ['content', true, 'Long text', 'Message text with supported {{variables}}', 60],
      ['active', true, 'YES/NO', 'Whether the template can be used', 14, { validation: yesNo }]
    ]
  }
];

const workbook = Workbook.create();
const instructions = workbook.worksheets.add('Instructions');
for (const spec of specifications) workbook.worksheets.add(spec.name);
const dictionary = workbook.worksheets.add('Data Dictionary');

function applyBase(sheet, range) {
  sheet.showGridLines = false;
  range.format.font = { name: FONT, size: 10, color: COLORS.text };
  range.format.verticalAlignment = 'center';
}

// Instructions / progress sheet
instructions.showGridLines = false;
instructions.tabColor = COLORS.navy;
instructions.getRange('A2:F2').merge();
instructions.getRange('A2').values = [['GymPulse owner master data workbook']];
instructions.getRange('A2').format.font = { name: FONT, size: 16, bold: true, color: COLORS.navy };
instructions.getRange('A3:F3').merge();
instructions.getRange('A3').values = [['Complete the input sheets and return this workbook without renaming sheets or columns.']];
instructions.getRange('A3').format.font = { name: FONT, size: 10, italic: true, color: '#5B6573' };
instructions.getRange('A5:F5').values = [['How to complete the workbook', '', '', '', '', '']];
instructions.getRange('A5:F5').merge();
instructions.getRange('A5:F5').format = { fill: COLORS.navy, font: { name: FONT, size: 10, bold: true, color: COLORS.white } };
instructions.getRange('A6:F11').values = [
  ['1', 'Enter the Gym Profile first and use the same gymCode wherever requested.', '', '', '', ''],
  ['2', 'Use unique codes to connect plans, trainers, staff, members, memberships, and PT records.', '', '', '', ''],
  ['3', 'Enter dates and times as real Excel values. Do not paste formatted images or merged data.', '', '', '', ''],
  ['4', 'Keep mobile numbers, pincodes, codes, and biometric device IDs as text.', '', '', '', ''],
  ['5', 'Do not include passwords, OTPs, Firebase credentials, bank details, or identity documents.', '', '', '', ''],
  ['6', 'Attendance logs and detailed payment history are transactional data and are not requested here.', '', '', '', '']
];
instructions.getRange('A6:A11').format.font = { name: FONT, bold: true, color: COLORS.blue };
instructions.getRange('B6:F11').merge(true);
instructions.getRange('A13:C13').values = [['Sheet', 'Rows entered', 'Status']];
instructions.getRange('A13:C13').format = { fill: COLORS.navy, font: { name: FONT, bold: true, color: COLORS.white }, horizontalAlignment: 'center' };
const progressRows = specifications.map((spec, index) => {
  const end = DATA_START + spec.rows - 1;
  const escaped = spec.name.replace(/'/g, "''");
  const row = 14 + index;
  return {
    row,
    values: [[spec.name, null, null]],
    countFormula: `=COUNTIF('${escaped}'!A${DATA_START}:A${end},"?*")`,
    statusFormula: `=IF(B${row}=0,"Not started","Data entered")`
  };
});
for (const item of progressRows) {
  instructions.getRange(`A${item.row}:C${item.row}`).values = item.values;
  instructions.getRange(`B${item.row}`).formulas = [[item.countFormula]];
  instructions.getRange(`C${item.row}`).formulas = [[item.statusFormula]];
}
instructions.getRange(`A14:C${13 + progressRows.length}`).format.borders = { preset: 'inside', style: 'thin', color: '#D9E2F3' };
instructions.getRange(`B14:B${13 + progressRows.length}`).format.numberFormat = '0';
instructions.getRange(`C14:C${13 + progressRows.length}`).conditionalFormats.add('containsText', { text: 'Not started', format: { fill: COLORS.red, font: { color: COLORS.redText, bold: true } } });
instructions.getRange(`C14:C${13 + progressRows.length}`).conditionalFormats.add('containsText', { text: 'Data entered', format: { fill: COLORS.green, font: { color: '#375623', bold: true } } });
instructions.getRange('E13:F13').values = [['Input legend', 'Meaning']];
instructions.getRange('E13:F13').format = { fill: COLORS.navy, font: { name: FONT, bold: true, color: COLORS.white } };
instructions.getRange('E14:F16').values = [
  ['Amber cells', 'Owner input area'],
  ['Red cell', 'A required value is missing in a started row'],
  ['Data Dictionary', 'Column definition, requirement, and accepted format']
];
instructions.getRange('E14').format.fill = COLORS.amber;
instructions.getRange('E15').format.fill = COLORS.red;
instructions.getRange('E16').format.fill = COLORS.lightBlue;
applyBase(instructions, instructions.getRange('A1:F30'));
instructions.getRange('A2').format.font = { name: FONT, size: 16, bold: true, color: COLORS.navy };
instructions.getRange('A5:F5').format.font = { name: FONT, bold: true, color: COLORS.white };
instructions.getRange('A13:C13').format.font = { name: FONT, bold: true, color: COLORS.white };
instructions.getRange('E13:F13').format.font = { name: FONT, bold: true, color: COLORS.white };
instructions.getRange('A:A').format.columnWidth = 24;
instructions.getRange('B:B').format.columnWidth = 60;
instructions.getRange('C:C').format.columnWidth = 18;
instructions.getRange('D:D').format.columnWidth = 4;
instructions.getRange('E:E').format.columnWidth = 22;
instructions.getRange('F:F').format.columnWidth = 42;
instructions.freezePanes.freezeRows(3);

// Input sheets
for (const spec of specifications) {
  const sheet = workbook.worksheets.getItem(spec.name);
  if (spec.tabColor) sheet.tabColor = spec.tabColor;
  sheet.showGridLines = false;
  const lastCol = colName(spec.columns.length);
  const endRow = DATA_START + spec.rows - 1;
  sheet.getRange(`A2:${lastCol}2`).merge();
  sheet.getRange('A2').values = [[spec.title]];
  sheet.getRange('A2').format.font = { name: FONT, size: 14, bold: true, color: COLORS.navy };
  sheet.getRange(`A3:${lastCol}3`).merge();
  sheet.getRange('A3').values = [[spec.instruction]];
  sheet.getRange('A3').format.font = { name: FONT, size: 10, italic: true, color: '#5B6573' };
  sheet.getRange(`A4:${lastCol}4`).values = [spec.columns.map(column => column[3])];
  sheet.getRange(`A4:${lastCol}4`).format = { fill: COLORS.lightBlue, font: { name: FONT, size: 9, italic: true, color: '#44546A' }, wrapText: true, verticalAlignment: 'center' };
  sheet.getRange(`A4:${lastCol}4`).format.rowHeight = 42;
  sheet.getRange(`A5:${lastCol}5`).values = [spec.columns.map(column => column[0])];
  sheet.getRange(`A5:${lastCol}5`).format = { fill: COLORS.navy, font: { name: FONT, size: 10, bold: true, color: COLORS.white }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true };
  sheet.getRange(`A5:${lastCol}5`).format.rowHeight = 30;
  const blankRows = Array.from({ length: spec.rows }, () => spec.columns.map(() => null));
  sheet.getRange(`A${DATA_START}:${lastCol}${endRow}`).values = spec.seedRows || blankRows;
  sheet.getRange(`A${DATA_START}:${lastCol}${endRow}`).format = { fill: COLORS.amber, font: { name: FONT, size: 10, color: COLORS.text }, verticalAlignment: 'center' };
  sheet.getRange(`A${DATA_START}:${lastCol}${endRow}`).format.rowHeight = 22;
  const table = sheet.tables.add(`A5:${lastCol}${endRow}`, true, spec.table);
  table.style = 'TableStyleMedium2';
  table.showBandedColumns = false;
  table.showFilterButton = true;

  spec.columns.forEach((column, index) => {
    const letter = colName(index + 1);
    const options = column[5] || {};
    sheet.getRange(`${letter}:${letter}`).format.columnWidth = column[4];
    const dataRange = sheet.getRange(`${letter}${DATA_START}:${letter}${endRow}`);
    if (options.format) dataRange.format.numberFormat = options.format;
    else if (['Text','Email','URL','lowercase-hyphen','Comma list'].includes(column[2])) dataRange.format.numberFormat = '@';
    if (options.validation) dataRange.dataValidation = { rule: { type: 'list', values: options.validation } };
    if (options.whole) sheet.dataValidations.add({ range: `${letter}${DATA_START}:${letter}${endRow}`, rule: { type: 'whole', operator: 'between', formula1: options.whole[0], formula2: options.whole[1] } });
    if (column[1]) {
      const rowLast = lastCol;
      dataRange.conditionalFormats.addCustom(`=AND(COUNTA($A${DATA_START}:$${rowLast}${DATA_START})>0,${letter}${DATA_START}="")`, { fill: COLORS.red, font: { color: COLORS.redText, bold: true } });
    }
  });

  // Flag duplicate primary codes while allowing unused blank rows.
  const keyRange = sheet.getRange(`A${DATA_START}:A${endRow}`);
  keyRange.conditionalFormats.addCustom(`=AND(A${DATA_START}<>"",COUNTIF($A$${DATA_START}:$A$${endRow},A${DATA_START})>1)`, { fill: COLORS.red, font: { color: COLORS.redText, bold: true } });
  sheet.freezePanes.freezeRows(5);
  sheet.freezePanes.freezeColumns(Math.min(2, spec.columns.length));
  applyBase(sheet, sheet.getRange(`A2:${lastCol}${endRow}`));
  sheet.getRange('A2').format.font = { name: FONT, size: 14, bold: true, color: COLORS.navy };
  sheet.getRange(`A5:${lastCol}5`).format.font = { name: FONT, size: 10, bold: true, color: COLORS.white };
}

// Data dictionary
dictionary.showGridLines = false;
dictionary.tabColor = '#7F8C8D';
dictionary.getRange('A2:F2').merge();
dictionary.getRange('A2').values = [['Data dictionary']];
dictionary.getRange('A2').format.font = { name: FONT, size: 14, bold: true, color: COLORS.navy };
dictionary.getRange('A3:F3').merge();
dictionary.getRange('A3').values = [['Use this sheet to confirm which columns are required and how every value should be entered.']];
dictionary.getRange('A3').format.font = { name: FONT, italic: true, color: '#5B6573' };
dictionary.getRange('A5:F5').values = [['Sheet', 'Column name', 'Required', 'Format', 'Allowed values / example', 'Definition']];
dictionary.getRange('A5:F5').format = { fill: COLORS.navy, font: { name: FONT, bold: true, color: COLORS.white }, horizontalAlignment: 'center', wrapText: true };
const dictionaryRows = [];
for (const spec of specifications) {
  for (const column of spec.columns) {
    const options = column[5] || {};
    dictionaryRows.push([
      spec.name,
      column[0],
      column[1] ? 'YES' : 'NO',
      column[2],
      options.validation ? options.validation.join(', ') : column[3],
      column[3]
    ]);
  }
}
const dictEnd = 5 + dictionaryRows.length;
dictionary.getRange(`A6:F${dictEnd}`).values = dictionaryRows;
const dictTable = dictionary.tables.add(`A5:F${dictEnd}`, true, 'DataDictionaryTable');
dictTable.style = 'TableStyleMedium2';
dictionary.getRange(`A6:F${dictEnd}`).format.font = { name: FONT, size: 10, color: COLORS.text };
dictionary.getRange(`C6:C${dictEnd}`).conditionalFormats.add('containsText', { text: 'YES', format: { fill: COLORS.amber, font: { color: COLORS.amberDark, bold: true } } });
dictionary.getRange('A:A').format.columnWidth = 24;
dictionary.getRange('B:B').format.columnWidth = 28;
dictionary.getRange('C:C').format.columnWidth = 12;
dictionary.getRange('D:D').format.columnWidth = 20;
dictionary.getRange('E:E').format.columnWidth = 42;
dictionary.getRange('F:F').format.columnWidth = 50;
dictionary.getRange(`A5:F${dictEnd}`).format.verticalAlignment = 'center';
dictionary.getRange(`E6:F${dictEnd}`).format.wrapText = true;
dictionary.freezePanes.freezeRows(5);
dictionary.freezePanes.freezeColumns(2);

workbook.recalculate();
await fs.mkdir(qaDir, { recursive: true });
for (const sheetName of ['Instructions', ...specifications.map(spec => spec.name), 'Data Dictionary']) {
  const spec = specifications.find(item => item.name === sheetName);
  const range = sheetName === 'Instructions'
    ? 'A1:F30'
    : sheetName === 'Data Dictionary'
      ? 'A1:F25'
      : `A1:${colName(spec.columns.length)}${Math.min(DATA_START + spec.rows - 1, 15)}`;
  const preview = await workbook.render({ sheetName, range, scale: 0.8, format: 'png' });
  await fs.writeFile(path.join(qaDir, `${sheetName.replace(/[^A-Za-z0-9]+/g, '_')}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const inspectSummary = await workbook.inspect({ kind: 'sheet,table', maxChars: 12000, tableMaxRows: 4, tableMaxCols: 8 });
await fs.writeFile(path.join(qaDir, 'inspect.ndjson'), inspectSummary.ndjson, 'utf8');
const errors = await workbook.inspect({ kind: 'match', searchTerm: '#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!', options: { useRegex: true, maxResults: 300 }, summary: 'final formula error scan' });
await fs.writeFile(path.join(qaDir, 'formula_errors.ndjson'), errors.ndjson, 'utf8');

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
