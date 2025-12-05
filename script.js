
const COMPENSATION_RATE = 0.7; 
const DAYS_PER_MONTH = 30;
const EMPLOYER_START_DAY = 4;
const EMPLOYER_END_DAY = 8;
const INSURANCE_START_DAY = 9;
const MAX_DAYS_REGULAR = 182;
const MAX_DAYS_TUBERCULOSIS = 240;


const form = document.getElementById('compensationForm');
const incomeInput = document.getElementById('income');
const daysInput = document.getElementById('days');
const tuberculosisCheckbox = document.getElementById('tuberculosis');
const incomeErrorEl = document.getElementById('incomeError');
const daysErrorEl = document.getElementById('daysError');

const employerDaysEl = document.getElementById('employerDays');
const employerAmountEl = document.getElementById('employerAmount');
const employerDailyEl = document.getElementById('employerDaily');
const insuranceDaysEl = document.getElementById('insuranceDays');
const insuranceAmountEl = document.getElementById('insuranceAmount');
const insuranceDailyEl = document.getElementById('insuranceDaily');
const totalDaysEl = document.getElementById('totalDays');
const totalAmountEl = document.getElementById('totalAmount');


form.addEventListener('submit', handleSubmit);
incomeInput.addEventListener('input', clearFieldError);
daysInput.addEventListener('input', clearFieldError);

function handleSubmit(event) {
  event.preventDefault();
  clearAllErrors();

  const income = parseFloat(incomeInput.value.trim());
  const days = parseInt(daysInput.value.trim(), 10);
  const hasTuberculosis = tuberculosisCheckbox.checked;

  const validation = validateInputs(income, days, hasTuberculosis);
  
  if (validation.errors && Object.keys(validation.errors).length > 0) {
    displayErrors(validation.errors);
  }
  
  if (validation.errors.income) {
    return;
  }
  
  const daysToCalculate = validation.cappedDays !== undefined ? validation.cappedDays : days;
  
  if (!isNaN(daysToCalculate) && daysToCalculate > 0) {
    const calculations = calculateCompensation(income, daysToCalculate, hasTuberculosis);
    updateResults(calculations);
  } else {
    resetResults();
  }
}

function validateInputs(income, days, hasTuberculosis) {
  const errors = {};
  let cappedDays = days;

  if (isNaN(income) || income <= 0 || !isFinite(income)) {
    errors.income = 'Please enter a valid positive income.';
  }

  if (isNaN(days) || days <= 0 || !Number.isInteger(days)) {
    errors.days = 'Please enter a valid number of sick days.';
  }

  if (!errors.days) {
    const maxDays = hasTuberculosis ? MAX_DAYS_TUBERCULOSIS : MAX_DAYS_REGULAR;
    if (days > maxDays) {
      errors.days = `Maximum days for ${hasTuberculosis ? 'tuberculosis' : 'regular case'} is ${maxDays}.`;
      cappedDays = maxDays; 
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    cappedDays
  };
}

function calculateCompensation(monthlyIncome, totalDays, hasTuberculosis) {
  const dailyCompensation = (monthlyIncome * COMPENSATION_RATE) / DAYS_PER_MONTH;
  const employerDays = calculateEmployerDays(totalDays);
  const employerAmount = employerDays * dailyCompensation;
  const insuranceDays = calculateInsuranceDays(totalDays);
  const insuranceAmount = insuranceDays * dailyCompensation;

  const totalAmount = employerAmount + insuranceAmount;

  return {
    employerDays,
    employerAmount,
    employerDaily: employerDays > 0 ? dailyCompensation : 0,
    insuranceDays,
    insuranceAmount,
    insuranceDaily: insuranceDays > 0 ? dailyCompensation : 0,
    totalDays,
    totalAmount
  };
}

function calculateEmployerDays(totalDays) {
  if (totalDays < EMPLOYER_START_DAY) {
    return 0;
  }
  const daysInRange = Math.min(totalDays, EMPLOYER_END_DAY) - EMPLOYER_START_DAY + 1;
  return Math.max(0, daysInRange);
}

function calculateInsuranceDays(totalDays) {
  return totalDays >= INSURANCE_START_DAY ? totalDays - INSURANCE_START_DAY + 1 : 0;
}

function displayErrors(errors) {
  if (errors.income) {
    incomeErrorEl.textContent = errors.income;
    incomeInput.setAttribute('aria-invalid', 'true');
  }
  if (errors.days) {
    daysErrorEl.textContent = errors.days;
    daysInput.setAttribute('aria-invalid', 'true');
    resetResults();
  }
}

function clearAllErrors() {
  incomeErrorEl.textContent = '';
  daysErrorEl.textContent = '';
  incomeInput.removeAttribute('aria-invalid');
  daysInput.removeAttribute('aria-invalid');
}

function clearFieldError(event) {
  const field = event.target;
  const errorEl = field.id === 'income' ? incomeErrorEl : daysErrorEl;
  errorEl.textContent = '';
  field.removeAttribute('aria-invalid');
}

function updateResults({ employerDays, employerAmount, employerDaily, insuranceDays, insuranceAmount, insuranceDaily, totalDays, totalAmount }) {
  employerDaysEl.textContent = `${employerDays} days`;
  employerAmountEl.textContent = formatCurrency(employerAmount);
  employerDailyEl.textContent = formatCurrency(employerDaily);

  insuranceDaysEl.textContent = `${insuranceDays} days`;
  insuranceAmountEl.textContent = formatCurrency(insuranceAmount);
  insuranceDailyEl.textContent = formatCurrency(insuranceDaily);

  totalDaysEl.textContent = totalDays;
  totalAmountEl.textContent = formatCurrency(totalAmount);
}

function resetResults() {
  updateResults({
    employerDays: 0,
    employerAmount: 0,
    employerDaily: 0,
    insuranceDays: 0,
    insuranceAmount: 0,
    insuranceDaily: 0,
    totalDays: 0,
    totalAmount: 0
  });
}

function formatCurrency(amount) {
  return `${amount.toFixed(2)}€`;
}
