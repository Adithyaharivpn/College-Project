// import { useState } from 'react'
// import { ThemeProvider } from '@emotion/react'
import './App.css'
import NavBar from './components/NavBar'
import theme from './theme'
import Body from './components/Body.jsx'
import { Route, Routes } from 'react-router-dom'
import { BrowserRouter as Router } from 'react-router-dom'
import React from 'react'
import About from './components/About.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'

const App = () => {
  return (
    <div>
      <Router>
        <NavBar/>
        <Routes>
          <Route path="/about " element={<About/>} />
          <Route path="/" element={<Body/>} />
          <Route path="/login" element={<Login/>} />
          <Route path="/signup" element={<Signup/>} />
        </Routes>
      </Router>
    </div>
  )
}

export default App

