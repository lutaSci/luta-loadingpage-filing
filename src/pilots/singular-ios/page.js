import { mountPilotPage } from './page-controller.js'
import { pilotConfig } from './config.js'
import './page.css'

mountPilotPage({ config: pilotConfig,
    credentials: window.lutaSingularIosPilotCredentials, window, document })
