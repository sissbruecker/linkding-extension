const CONFIG_KEY = 'ld_ext_config'
const DEFAULTS = {
  baseUrl: '',
  token: '',
  default_tags: '',
}

export function getConfiguration() {
  const configJson = localStorage.getItem(CONFIG_KEY)
  const config = configJson ? JSON.parse(configJson) : {}
  return {
    ...DEFAULTS,
    ...config,
  }
}

export function saveConfiguration(config) {
  const configJson = JSON.stringify(config)
  localStorage.setItem(CONFIG_KEY, configJson)
}

export function isConfigurationComplete() {
  const config = getConfiguration()

  return config.baseUrl && config.token
}
