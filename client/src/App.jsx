// import { useState } from 'react'
import { ThemeProvider } from '@emotion/react'
import './App.css'
import NavBar from './components/NavBar'
import theme from './theme'
import Body from './components/Body.jsx'

function App() {

  return (
    <>
    <ThemeProvider theme={theme}>
    <NavBar/>
    <main>
      <Body/>
    </main>
    </ThemeProvider>
    
    </>
  )
}

export default App
