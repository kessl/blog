function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

const isDark = localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
applyTheme(isDark ? 'dark' : 'light')

document.getElementById('theme-toggle').addEventListener('click', function() {
  const newTheme = !('theme' in localStorage) ?
    document.documentElement.classList.contains('dark') ? 'light' : 'dark' :
    localStorage.theme === 'dark' ? 'light' : 'dark'
  localStorage.theme = newTheme
  applyTheme(newTheme)
})
