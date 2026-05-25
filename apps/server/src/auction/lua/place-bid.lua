-- KEYS[1] = auction:{id}:state
-- KEYS[2] = auction:{id}:bids
-- ARGV[1] = bid_amount
-- ARGV[2] = bidder_user_id (string)
-- ARGV[3] = bidder_nickname (string, may be empty)
-- ARGV[4] = now_ms
-- ARGV[5] = max_bids_to_keep

local state = redis.call('HMGET', KEYS[1],
  'status','highest_bid','highest_bidder_id',
  'starting_price','min_increment',
  'start_time_ms','current_end_time_ms','extension_window_ms',
  'original_end_time_ms')

if state[1] == false or state[1] == nil then
  return {0, 'NOT_FOUND'}
end

local status               = state[1]
local highest_bid          = tonumber(state[2]) or 0
local prev_highest_bidder  = state[3] or ''
local starting_price       = tonumber(state[4]) or 0
local min_increment        = tonumber(state[5]) or 0
local start_time_ms        = tonumber(state[6]) or 0
local current_end_time_ms  = tonumber(state[7]) or 0
local extension_window_ms  = tonumber(state[8]) or 0
local original_end_time_ms = tonumber(state[9]) or current_end_time_ms

local bid_amount = tonumber(ARGV[1])
local bidder_id  = ARGV[2]
local nickname   = ARGV[3]
local now_ms     = tonumber(ARGV[4])

if bid_amount == nil or now_ms == nil then return {0, 'BAD_INPUT'} end
if status ~= 'ACTIVE' then return {0, 'NOT_ACTIVE'} end
if now_ms < start_time_ms then return {0, 'NOT_STARTED'} end
if now_ms >= current_end_time_ms then return {0, 'ALREADY_ENDED'} end

local required_min
if highest_bid == 0 then
  required_min = starting_price
else
  required_min = highest_bid + min_increment
end

if bid_amount < required_min then
  return {0, 'BID_TOO_LOW', tostring(required_min)}
end

local triggered_extension = 0
local new_end_time_ms = current_end_time_ms
if now_ms >= (current_end_time_ms - extension_window_ms) then
  new_end_time_ms = now_ms + extension_window_ms
  triggered_extension = 1

  -- 최초 설정된 종료 시각을 초과하여 연장되는 경우 분 단위 올림.
  -- 마감 시각이 항상 분 정시(HH:MM:00)가 되도록 하여 입찰자가 초 단위 경쟁을 하지 않도록 완화.
  -- 호스트가 설정한 연장 시간이 최소 보장됨 (실제 연장: N분 ~ N분 59초).
  if new_end_time_ms > original_end_time_ms then
    new_end_time_ms = math.ceil(new_end_time_ms / 60000) * 60000
  end
end

redis.call('HSET', KEYS[1],
  'highest_bid', tostring(bid_amount),
  'highest_bidder_id', bidder_id,
  'highest_bidder_nickname', nickname,
  'last_bid_ts_ms', tostring(now_ms),
  'current_end_time_ms', tostring(new_end_time_ms))

local bid_json = string.format(
  '{"bidderId":"%s","nickname":"%s","amount":%d,"ts":%d,"ext":%d}',
  bidder_id,
  string.gsub(nickname, '"', '\\"'),
  bid_amount,
  now_ms,
  triggered_extension)

redis.call('LPUSH', KEYS[2], bid_json)
redis.call('LTRIM', KEYS[2], 0, tonumber(ARGV[5]) - 1)

return {1, 'OK',
  tostring(bid_amount),
  bidder_id,
  tostring(new_end_time_ms),
  tostring(triggered_extension),
  tostring(now_ms),
  prev_highest_bidder}
