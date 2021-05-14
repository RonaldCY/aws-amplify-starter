import '@aws-amplify/ui/dist/style.css';
import Amplify from 'aws-amplify';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import aws_exports from "./aws-exports";
import reportWebVitals from './reportWebVitals';

Amplify.configure(aws_exports);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
