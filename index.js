const { randomBytes } = require('crypto')
const EventEmitter = require('events')
const Koa = require('koa')
const bodyparser = require('koa-bodyparser')
const Router = require('koa-router')


// Create instances of the packages we need to use
const app = new Koa()
const router = new Router()
const log = new EventEmitter()


;['local', 'trace', 'debug', 'info', 'warn', 'error', 'fatal'].forEach((event) => {
  log.on(event, (data) => console.log(data))
})


// register routes and handlers for our app
router.get('/', async (ctx) => {
  const { request, response } = ctx


  log.emit('debug', { key: 'request_received', requestId: ctx.state.requestId, url: request.url })


  ctx.status = 200
  ctx.body = { ok: true }
})
router.get('/error', async (ctx) => {
  throw new Error('BOOM!')
})
router.post('/slack/install/authorize', async (ctx) => {
  log.emit('debug', { key: 'request_received', requestId: ctx.state.requestId, url: request.url })
  ctx.status = 501 // not implemented
})
router.post('/slack/install/verify', async (ctx) => {
  log.emit('debug', { key: 'request_received', requestId: ctx.state.requestId, url: request.url })
  ctx.status = 501 // not implemented
})
router.post('/slack/events', async (ctx) => {
  log.emit('debug', { key: 'request_received', requestId: ctx.state.requestId, url: request.url })
  ctx.status = 501 // not implemented
})
router.post('/slack/interactions', async (ctx) => {
  log.emit('debug', { key: 'request_received', requestId: ctx.state.requestId, url: request.url })
  ctx.status = 501 // not implemented
})
router.post('/slack/commands', async (ctx) => {
  log.emit('debug', { key: 'request_received', requestId: ctx.state.requestId, url: request.url })
  ctx.status = 501 // not implemented
})


app.on('error', (err, ctx) => log.emit('error', {
  key: 'request_error', requestId: ctx.state && ctx.state.requestId, err
}))


// register the middleware
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status || 500
    ctx.body = ['prod', 'production'].includes(process.env.NODE_ENV)
      ? { ok: false, message: err.clientSafeMessage }
      : { ok: false, message: err.message, stack: err.stack }
    ctx.app.emit('error', err, ctx)
  }
})
app.use(async (ctx, next) => {
  ctx.state = {}
  ctx.state.requestId = randomBytes(4).toString('hex')
  await next()
})
app.use(async (ctx, next) => {
  const startMs = Date.now()
  await next()
  const endMs = Date.now()
  log.emit('info', {
    key: 'request_latency',
    requestId: ctx.state.requestId,
    startMs,
    endMs,
    durationMs: endMs - startMs,
  })
})
app.use(bodyparser())
app.use(router.routes())


const port = process.env.PORT || 3000
app.listen({ port })
log.emit('info', { key: 'app_startup', timestamp: Date.now(), port })