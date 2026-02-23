import React from 'react';

// Use a plain function component without hooks to avoid any useContext issues during SSG
function ErrorPage({ statusCode }: { statusCode?: number }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      fontFamily: 'sans-serif'
    }}>
      <h1>{statusCode ? `${statusCode}` : 'An error occurred'}</h1>
      <p>{statusCode === 404 ? 'Page not found' : 'An unexpected error occurred'}</p>
      <a href="/" style={{ marginTop: '20px', color: '#C9A86C' }}>Go back home</a>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
