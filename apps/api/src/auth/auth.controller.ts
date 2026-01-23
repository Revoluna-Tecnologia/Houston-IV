import { All, Controller, Req, Res } from '@nestjs/common'
import { Request, Response } from 'express'
import { auth } from '../auth.config'
import { toNodeHandler } from 'better-auth/node'
import { Public } from './decorators/public.decorator'

@Controller('auth')
export class AuthController {
  private handler = toNodeHandler(auth)

  @Public()
  @All('*path')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    return this.handler(req, res)
  }
}
