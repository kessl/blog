const legal_person_tax_rate = 0.19
const natural_person_tax_rate = 0.15
const monthly_fixed_tax_2022 = 5_994 // CZK
const monthly_fixed_tax_2023 = function (revenue, fixed_expenses_rate) {
  if (revenue <= 1_000_000 || (revenue <= 1_500_000 && fixed_expenses_rate === 0.6) || (revenue <= 2_000_000 && fixed_expenses_rate === 0.8)) {
    return 6_500
  } else if (revenue <= 1_500_000 || (revenue <= 2_000_000 && fixed_expenses_rate === 0.6)) {
    return 16_000
  } else {
    return 26_000
  }
} // CZK
const health_insurance_rate = 0.135
const social_contribution_rate = 0.292
const minimum_health_insurance_payment = 2_627 // CZK, 2022
const minimum_social_contribution_payment = 2_841 // CZK, 2022
const fixed_tax_limit_2022 = 1_000_000 // CZK
const fixed_tax_limit_2023 = 2_000_000 // CZK
const base_discount_2022 = 30_840 // CZK

const expenses_input = document.querySelector('input[name=expenses]')
const expenses_label = document.getElementById('expenses_label')
const fixed_2022_revenue = document.getElementById('fixed_2022_revenue')
const fixed_2023_revenue = document.getElementById('fixed_2023_revenue')

const inputs = {
  revenue: 800_000,
  expenses: 400_000,
  fixed_expenses: false,
  fixed_expenses_rate: 0.6,
  additional_discount: 0,
}

for (const field of Object.keys(inputs)) {
  for (const el of document.querySelectorAll(`input[name=${field}]`)) {
    if (el.type === 'number') {
      onChange(field, +el.value)
    }
    el.addEventListener('change', function (e) {
      onChange(field, e.target.type === 'checkbox' ? e.target.checked : +e.target.value)
    })
  }
}

document.getElementById('toggle_additional_discount').addEventListener('click', function (e) {
  e.preventDefault()
  const row = document.getElementById("additional_discount_row")
  row.classList.toggle('hidden')

  const hidden = row.classList.contains('hidden')
  e.target.innerHTML = hidden ? 'Přidat další slevu' : 'Odebrat slevu'
  if (hidden) {
    onChange('additional_discount', 0)
  }
})

function toggleTitle(el, title, force) {
  if (force) {
    el.title = title
  } else {
    el.removeAttribute('title')
  }
}

function onChange(field, value) {
  inputs[field] = +value

  const fixed_2022_ineligible = inputs.revenue > fixed_tax_limit_2022
  fixed_2022_revenue.classList.toggle('error', fixed_2022_ineligible)
  toggleTitle(fixed_2022_revenue, `V roce 2022 nesplňujete příjmový limit ${fixed_tax_limit_2022.toLocaleString('cs')} Kč`, fixed_2022_ineligible)

  const fixed_2023_ineligible = inputs.revenue > fixed_tax_limit_2023
  fixed_2023_revenue.classList.toggle('error', fixed_2023_ineligible)
  toggleTitle(fixed_2023_revenue, `V roce 2023 nesplňujete příjmový limit ${fixed_tax_limit_2023.toLocaleString('cs')} Kč`, fixed_2023_ineligible)

  updateValues(field, value)
  updateCells('company', calculateCompanyTax(inputs))
  updateCells('standard', calculateStandardTax(inputs))
  updateCells('fixed_2022', calculateFixed2022Tax(inputs))
  updateCells('fixed_2023', calculateFixed2023Tax(inputs))
}

function updateValues(field, value) {
  for (const el of document.getElementsByClassName(field)) {
    let val, format
    if (typeof value === 'number') {
      val = value
      format = { maximumFractionDigits: 0 }
    } else {
      val = value.value
      format = value.format
    }
    el.innerHTML = val.toLocaleString('cs', format)
  }
}

function updateCells(prefix, outputs) {
  for (const [field, value] of Object.entries(outputs)) {
    updateValues(`${prefix}_${field}`, value)
  }
}

function calculateCompanyTax(inputs) {
  const tax_basis = inputs.revenue - inputs.expenses
  const legal_person_tax = Math.max(legal_person_tax_rate * tax_basis, 0)
  const natural_person_tax = Math.max(natural_person_tax_rate * (1 - legal_person_tax_rate) * tax_basis, 0)
  const total_tax = legal_person_tax + natural_person_tax
  const discounted_tax = Math.max(total_tax - base_discount_2022 - inputs.additional_discount, 0)
  return {
    expenses: inputs.expenses,
    tax_basis,
    legal_person_tax,
    natural_person_tax,
    total_tax,
    discounted_tax,
    base_discount: base_discount_2022,
    effective_tax_rate: {
      value: discounted_tax / inputs.revenue,
      format: { style: 'percent', minimumFractionDigits: 1 }
    }
  }
}

function calculateStandardTax(inputs) {
  const expenses = inputs.fixed_expenses ? inputs.revenue * inputs.fixed_expenses_rate : inputs.expenses
  const tax_basis = inputs.revenue - expenses
  const insurance_basis = tax_basis / 2
  const natural_person_tax = Math.max(natural_person_tax_rate * tax_basis, 0)
  const health_insurance = Math.max(insurance_basis * health_insurance_rate, minimum_health_insurance_payment * 12)
  const social_contribution = Math.max(insurance_basis * social_contribution_rate, minimum_social_contribution_payment * 12)
  const total_tax = natural_person_tax + health_insurance + social_contribution
  const discounted_tax = Math.max(total_tax - base_discount_2022 - inputs.additional_discount, 0)
  return {
    expenses,
    tax_basis,
    natural_person_tax,
    health_insurance,
    social_contribution,
    total_tax,
    discounted_tax,
    base_discount: base_discount_2022,
    effective_tax_rate: {
      value: discounted_tax / inputs.revenue,
      format: { style: 'percent', minimumFractionDigits: 1 }
    }
  }
}

function calculateFixed2022Tax(inputs) {
  const fixed_tax = monthly_fixed_tax_2022 * 12
  return {
    fixed_tax,
    total_tax: fixed_tax,
    discounted_tax: fixed_tax,
    effective_tax_rate: {
      value: fixed_tax / inputs.revenue,
      format: { style: 'percent', minimumFractionDigits: 1 }
    }
  }
}

function calculateFixed2023Tax(inputs) {
  const fixed_tax = monthly_fixed_tax_2023(inputs.revenue, inputs.fixed_expenses_rate) * 12
  return {
    fixed_tax,
    total_tax: fixed_tax,
    discounted_tax: fixed_tax,
    effective_tax_rate: {
      value: fixed_tax / inputs.revenue,
      format: { style: 'percent', minimumFractionDigits: 1 }
    }
  }
}
