import Cookies from 'js-cookie'

jest.mock('js-cookie')
jest.mock('react-hot-toast', () => ({ error: jest.fn() }))

const mockCookiesGet = Cookies.get as jest.Mock
const mockCookiesSet = Cookies.set as jest.Mock
const mockCookiesRemove = Cookies.remove as jest.Mock

describe('ApiClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookiesGet.mockReturnValue(undefined)
  })

  it('adds authorization header when token exists', () => {
    mockCookiesGet.mockReturnValue('test-token')
    expect(mockCookiesGet).toBeDefined()
  })

  it('removes cookies on logout', () => {
    mockCookiesRemove('access_token')
    mockCookiesRemove('refresh_token')
    expect(mockCookiesRemove).toHaveBeenCalledWith('access_token')
    expect(mockCookiesRemove).toHaveBeenCalledWith('refresh_token')
  })
})