import { singleton } from "tsyringe";
import { DbService } from "./db.service";
import BaseController from "@/utils/customBaseController";
import { StatusCodes } from "express-http-status";
import { BoardCreateDTO, BoardUpdateDTO } from "@/schemas/board.schema";

@singleton()
export default class BoardService {
  constructor(private db: DbService, private controller: BaseController) {}

  async getBoards(uid: string, domainId: string) {
    try {
      // Implement your logic to retrieve boards for a user, e.g., based on the user's membership
      // You can customize this based on your application requirements
      const boards = await this.db.board.findMany({
        where: {
          domainId,
          domain: {
            domainMembers: {
              some: {
                userId: uid,
              },
            },
          },
        },
      });

      return this.controller.sendResponse("Boards", boards);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async getBoard(uid: string, boardId: string) {
    try {
      // Implement your logic to retrieve a specific board, e.g., based on user's membership
      const board = await this.db.board.findUnique({
        where: {
          id: boardId,
          domain: {
            domainMembers: {
              some: {
                userId: uid,
              },
            },
          },
        },
      });

      return this.controller.sendResponse("Board", board);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async createBoard(uid: string, dto: BoardCreateDTO) {
    try {
      // Implement your logic to create a new board, e.g., validate user's permission
      const createdBoard = await this.db.board.create({
        data: dto,
      });

      return this.controller.sendResponse("Board created", createdBoard);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async editBoard(uid: string, boardId: string, dto: BoardUpdateDTO) {
    try {
      // Implement your logic to edit a board, e.g., validate user's permission
      const updatedBoard = await this.db.board.update({
        where: {
          id: boardId,
          domain: {
            domainMembers: {
              some: {
                userId: uid,
              },
            },
          },
        },
        data: dto,
      });

      return this.controller.sendResponse("Board updated", updatedBoard);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }

  async deleteBoard(uid: string, boardId: string) {
    try {
      // Implement your logic to delete a board, e.g., validate user's permission
      const deletedBoard = await this.db.board.delete({
        where: {
          id: boardId,
          domain: {
            domainMembers: {
              some: {
                userId: uid,
              },
            },
          },
        },
      });

      return this.controller.sendResponse("Board deleted", deletedBoard);
    } catch (err) {
      console.log(err);
      return this.controller.createError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Internal server error"
      );
    }
  }
}
