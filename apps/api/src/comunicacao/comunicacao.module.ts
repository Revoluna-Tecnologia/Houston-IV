/**
 * Comunicacao Module
 * Módulo principal que agrupa todos os submódulos de comunicação
 */

import { Module } from '@nestjs/common'
import { ConversationsModule } from './conversations/conversations.module'
import { MessagesModule } from './messages/messages.module'
import { ContactsModule } from './contacts/contacts.module'
import { ShiftOffersModule } from './shift-offers/shift-offers.module'

@Module({
  imports: [
    ConversationsModule,
    MessagesModule,
    ContactsModule,
    ShiftOffersModule,
  ],
  exports: [
    ConversationsModule,
    MessagesModule,
    ContactsModule,
    ShiftOffersModule,
  ],
})
export class ComunicacaoModule {}
