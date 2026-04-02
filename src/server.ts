import app from './app';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`
    ProSystem API is running!
    Port: ${PORT}
    Environment: ${process.env.NODE_ENV}
    Started: ${new Date().toLocaleString()}
  `);
});