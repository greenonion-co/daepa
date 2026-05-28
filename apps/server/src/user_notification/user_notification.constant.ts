export enum USER_NOTIFICATION_TYPE {
  PARENT_REQUEST = 'parent_request',
  PARENT_ACCEPT = 'parent_accept',
  PARENT_REJECT = 'parent_reject',
  PARENT_CANCEL = 'parent_cancel',
  ADOPTION_COMPLETE = 'adoption_complete',
  AUCTION_STARTED = 'auction_started',
  AUCTION_ENDED_HOST = 'auction_ended_host',
  AUCTION_ENDED_WINNER = 'auction_ended_winner',
  AUCTION_OUTBID = 'auction_outbid',
}

export enum USER_NOTIFICATION_STATUS {
  READ = 'read',
  UNREAD = 'unread',
  DELETED = 'deleted',
}
