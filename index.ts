import {app} from './src/app/app'

const PORT = process.env.PORT || 3000

/****************************************************
 Start Server
 ****************************************************/

app.listen(PORT, () => {
  console.log(`Server running on port:${PORT}`)
})
